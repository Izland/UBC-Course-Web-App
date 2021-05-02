import AddDatasetRoomHelpers from "./AddDatasetRoomHelpers";
import { InsightError } from "./IInsightFacade";

export default class AddDatasetRoomGetters {
    public static getBuildingTable(indexFile: any): any {
        const tables: any[] = AddDatasetRoomHelpers.findElements(indexFile, "table", null);
        let buildingTable: any;
        if (tables.length === 0) {
            return null;
        }
        if (tables.length > 1) {
            // Finds the table that contains a table containing a table header associated with building data
            buildingTable = tables.find((table) => AddDatasetRoomHelpers.findElements(table, "th",
                { class: "views-field views-field-field-building-code" }).length);
        } else {
            buildingTable = tables[0];
        }
        return buildingTable ? buildingTable : null;
    }

    public static getRoomTable(buildingHTML: any): any {
        const contentArray = AddDatasetRoomHelpers.findElements(buildingHTML, "div", { class: "view-content" });
        for (const contentDiv of contentArray) {
            const roomTables = AddDatasetRoomHelpers.findElements(contentDiv, "table", null);
            if (roomTables.length === 1) {
                return roomTables[0];
            }
        }
        return null;
    }


    public static getBuildingInfo(buildingHTML: any): Promise<any> {
        let buildingName: string;
        let buildingAddress: string;
        let buildingLat: number;
        let buildingLon: number;

        return new Promise((resolve, reject) => {
            try {
                // Get building name
                const buildingInfoHTML = AddDatasetRoomHelpers.findElements(buildingHTML, "div",
                    { id: "building-info" })[0];
                const buildingNameTextTag = AddDatasetRoomHelpers.findElements(buildingInfoHTML, "span",
                    { class: "field-content" })[0].childNodes[0];
                buildingName = buildingNameTextTag.value;
                // Get building address
                buildingAddress = AddDatasetRoomHelpers.findElements(buildingInfoHTML, "div",
                    { class: "field-content" })[0].childNodes[0].value;
            } catch {
                reject(new Error("File doesn't have building info div"));
            }
            return this.getBuildingCoordinates(buildingAddress)
                .then((latLonObj: any) => {
                    buildingLat = latLonObj.lat;
                    buildingLon = latLonObj.lon;

                    return resolve({ buildingName, buildingAddress, buildingLat, buildingLon });
                })
                .catch((err) => {
                    return reject(err);
                });

        });
    }

    public static getBuildingCoordinates(buildingAddress: string): Promise<any> {
        const http = require("http");
        const encodedAddress = buildingAddress.replace(/\s/g, "%20");
        return new Promise((resolve, reject) => {
            const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team228/${encodedAddress}`;
            const req = http.get(url, (res: any) => {
                if (res.statusCode !== 200) {
                    reject("Request failed");
                }
                let rawData = "";
                let parsedObj: any;
                res.on("data", (chunk: any) => rawData += chunk);
                res.on("end", () => {
                    try {
                        parsedObj = JSON.parse(rawData);
                    } catch (e) {
                        reject(new Error("Didn't parse correctly"));
                    }
                    if ("lat" in parsedObj) {
                        resolve({ lat: parsedObj.lat, lon: parsedObj.lon });
                    }
                }
                );
            });
            req.on("error", () => reject(new InsightError("Http request failed")));
        });
    }

    public static getRoomDataFromRow(roomTableRow: any): any {
        let roomsShortName: string;
        let roomsNumber: string;
        let roomsName: string;
        let roomsSeats: number;
        let roomsType: string;
        let roomsFurniture: string;
        let roomsHREF: string;
        try {
            roomsNumber = AddDatasetRoomHelpers.findElements(roomTableRow, "a", { title: "Room Details" })[0]
                .childNodes[0].value.match(/\w+/).join("");
            try {
                roomsSeats = parseInt(AddDatasetRoomHelpers
                    .findElements(roomTableRow, "td", {class: "room-capacity"})[0]
                    .childNodes[0].value.match(/\w+/).join(""), 10);
            } catch {
                roomsSeats = 0;
            }
            roomsFurniture = AddDatasetRoomHelpers.findElements(roomTableRow, "td", {class: "room-furniture"})[0]
                .childNodes[0].value;
            // Assigns based on whether the roomsFurniture tag is empty
            roomsFurniture = roomsFurniture.match(/\w/) !== null ? roomsFurniture.match(/\w.*\w/).join("") : "";
            roomsType = AddDatasetRoomHelpers.findElements(roomTableRow, "td", {class: "room-type"})[0]
                .childNodes[0].value;
            // Assigns based on whether the roomstype tag is empty
            roomsType = roomsType.match(/\w/) !== null ? roomsType.match(/\w.*\w/).join("") : "";
            roomsHREF = this.getAttrValue(AddDatasetRoomHelpers.findElements(roomTableRow, "a", null)[0], "href");
            const match = roomsHREF.match(/(?:\/)((\w+)(-\w+))$/);
            roomsName = match[1].replace("-", "_");
            roomsShortName = match[2];

            const roomObj: any = {
                rooms_shortname: roomsShortName,
                rooms_number: roomsNumber,
                rooms_name: roomsName,
                rooms_seats: roomsSeats,
                rooms_type: roomsType,
                rooms_furniture: roomsFurniture,
                rooms_href: roomsHREF
            };
            for (const prop in roomObj) {
                if (roomObj[prop] === undefined || roomObj[prop] === null) {
                    return null;
                }
            }
            return roomObj;

        } catch (IndexError) {
            return null;
        }
    }

    public static getAttrValue(element: any, attrKey: string): string {
        if (element.attrs && element.attrs.length > 0) {
            for (const attr of element.attrs) {
                if (attr.name === attrKey) {
                    return attr.value;
                }
            }
        }
        return null;
    }
}
