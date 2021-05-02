import {
    IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError
} from "./IInsightFacade";

import AddDatasetRoomGetters from "./AddDatasetRoomGetters";
import Log from "../Util";

export default class AddDatasetRoomHelpers {
    public static loadRoomDataset(id: string, content: string): Promise<any[]> {
        const currZip = require("jszip");
        const parse5 = require("parse5");
        let loadedZip: any;
        return new Promise<string[]>((resolve, reject) => {
            return currZip.loadAsync(content, { base64: true })
                .then((zip: any) => {
                    loadedZip = zip;
                    const indexFile = zip.folder("rooms").file("index.htm");
                    if (zip.folder(/rooms/).length === 0 || indexFile === null) {
                        return Promise.reject(new InsightError("Improper folder format"));
                    }

                    return indexFile.async("string");
                })
                .then((indexFileString: string) => {
                    const indexFileObj = parse5.parse(indexFileString);

                    // Get building table
                    const buildingTable: any = AddDatasetRoomGetters.getBuildingTable(indexFileObj);

                    // Extract building links from index file
                    const buildingLinks: any[] = this.extractBuildingsFromTable(buildingTable);

                    return this.extractBuildingHTML(loadedZip, buildingLinks);
                })
                .then((buildingHTML: any[]) => {
                    return resolve(this.extractRoomsFromBuildings(buildingHTML));
                })
                .catch(() => reject(new InsightError()));
        }).catch(() => Promise.reject(new InsightError()));
    }

    public static updateDatasetsWithRoomDataset(datasetField: any, rooms: any[], id: string): any {
        const datasetObj = {
            meta: {
                id: id,
                kind: InsightDatasetKind.Rooms,
                numRows: rooms.length
            },
            items: rooms
        };
        datasetField[id] = datasetObj;
        return datasetField;
    }

    public static extractBuildingsFromTable(buildingTable: any): any[] {
        let tBody: any;
        let buildingRows: any[];
        let buildingLinks: any[] = [];
        let td;
        let aElement;
        let href;


        tBody = buildingTable.childNodes.find((element: any) => element.nodeName === "tbody");
        buildingRows = tBody.childNodes.filter((child: any) => child.nodeName === "tr");

        try {
            for (const building of buildingRows) {
                aElement = this.findElements(building, "a", null)[0];

                // td = building.childNodes.find((element: any) => element.nodeName === "td");
                // aElement = td.childNodes.find((element: any) => element.nodeName === "a");
                href = aElement.attrs.find((element: any) => element.name === "href");
                buildingLinks.push(href.value);
           }
        } catch (e) {
            Log.trace(e);
        }
        return buildingLinks;

    }

    public static extractRoomsFromBuildings(buildingHTML: any[]): Promise<any[]> {
        let rooms: Array<Promise<any>> = [];

        for (const building of buildingHTML) {
            if (!(this.doesBuildingHaveRooms(building))) {
                continue;
            }
            rooms = rooms.concat(this.extractRoomsFromBuilding(building)
            .catch(() => Promise.resolve([])));
        }

        if (rooms.length === 0) {
            return Promise.reject(new InsightError("No valid rooms"));
        }

        // Since rooms is an array of room arrays, we reconfigure the return value to be just a room array
        return Promise.all(rooms).then((roomsArray: any[]) => {
            let combinedArray: any[] = [];
            for (const array of roomsArray) {
                combinedArray = combinedArray.concat(array);
            }
            return Promise.resolve(combinedArray);
        });
    }

    public static extractRoomsFromBuilding(building: any): Promise<any[]> {
        let rooms: any[] = [];
        return AddDatasetRoomGetters.getBuildingInfo(building).then((buildingInfo: any) => {
            // Grab any building room table data if present (located in div with class "view-content")
            const roomTable = AddDatasetRoomGetters.getRoomTable(building);
            const roomTableData = this.findElements(roomTable, "tr", null);

            for (const row of roomTableData) {
                const roomData: any = AddDatasetRoomGetters.getRoomDataFromRow(row);
                if (!roomData) {
                    continue;
                }
                rooms.push({
                    rooms_fullname: buildingInfo.buildingName,
                    rooms_shortname: roomData.rooms_shortname,
                    rooms_number: roomData.rooms_number,
                    rooms_name: roomData.rooms_name,
                    rooms_address: buildingInfo.buildingAddress,
                    rooms_lat: buildingInfo.buildingLat,
                    rooms_lon: buildingInfo.buildingLon,
                    rooms_seats: roomData.rooms_seats,
                    rooms_type: roomData.rooms_type,
                    rooms_furniture: roomData.rooms_furniture,
                    rooms_href: roomData.rooms_href
                });
            }
            return Promise.resolve(rooms);
        }).catch((err) => {
            return Promise.reject(new InsightError("Something went wrong in extractRoomsFromBuilding"));
        });
    }

    public static extractBuildingHTML(zip: any, buildingLinks: any[]): Promise<any[]> {
        const parse5 = require("parse5");
        const buildingFolder = zip.folder("rooms").folder("campus")
        .folder("discover").folder("buildings-and-classrooms");

        buildingLinks = buildingLinks.filter((buildingLink: any) => {
            const fileName: string = buildingLink.match(/\w+$/).join("");
            const regExp = new RegExp(fileName);
            return buildingFolder.file(regExp).length !== 0;
        });
        const unparsedHTML: Array<Promise<string>> = buildingLinks.map((buildingLink: any) => {
            // const folderPath = buildingLink.match(/\w+.+\//).join("");
            const fileName = buildingLink.match(/\w+$/).join("");
            const buildingFile = buildingFolder.file(fileName);
            return buildingFile.async("string");
        });

        return Promise.all(unparsedHTML).then((buildingFiles: string[]) => {
            return new Promise((resolve, reject) => {
                try {
                    const parsedBuildingHTML = buildingFiles.map((buildingFile: string) => parse5.parse(buildingFile));
                    resolve(parsedBuildingHTML);
                } catch (e) {
                    Log.trace(e);
                    reject(new InsightError());
                }
            });
        });
    }

    public static doesBuildingHaveRooms(buildingHTML: any): boolean {
        const content = this.findElements(buildingHTML, "div", { class: "view-content" });
        if (content.length === 0) {
            return false;
        }
        for (const div of content) {
            const tables = this.findElements(div, "table", null);
            if (tables.length > 0) {
                return true;
            }
        }
        return false;
    }

    public static findElements(element: any, tagToFind: string, attributeToFind: any): any[] {
        // attributeToFind should be an object with a key: value pair inside
        let matchingElements: any[] = [];

        // base cases:
        if (tagToFind && attributeToFind) {
            const keyToFind = Object.keys(attributeToFind)[0];
            const valueToFind: any = Object.values(attributeToFind)[0];
            if (element.nodeName === tagToFind && element.attrs && element.attrs.length > 0) {
                for (const attr of element.attrs) {
                    if (attr.name === keyToFind
                    && attr.value.includes(valueToFind)) {
                        matchingElements.push(element);
                    }
                }
            }
        } else if (tagToFind && element.nodeName === tagToFind) {
            matchingElements.push(element);
        } else if (attributeToFind) {
            const keyToFind = Object.keys(attributeToFind)[0];
            const valueToFind: any = Object.values(attributeToFind)[0];
            for (const attr of element.attrs) {
                if (attr.name === attributeToFind[keyToFind] && attr.value === attributeToFind[valueToFind]) {
                    matchingElements.push(element);
                }
            }
        }

        // Recursion section
        if (element.childNodes && element.childNodes.length > 0) {
            for (const childNode of element.childNodes) {
                matchingElements = matchingElements.concat(this.findElements(childNode, tagToFind, attributeToFind));
            }
        }

        return matchingElements;
    }
}
