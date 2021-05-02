import PerformQueryChecks from "./PerformQueryChecks";
import PerformQueryTransformationsCheck from "./PerformQueryTransformationsCheck";

export default class PerformQueryOptionsChecks {

    public static areOptionsValid(query: any): boolean { // return true if options and order is valid, else return false
        if (typeof query["OPTIONS"]["COLUMNS"] === "undefined") {
            return false; // columns does not exist
        } else if (Array.isArray(query["OPTIONS"])) { // options is an array
            return false;
        } else if (!(Array.isArray(query["OPTIONS"]["COLUMNS"]))) { // columns is not an array
            return false;
        } else if (query["OPTIONS"]["COLUMNS"].length === 0) { // columns is empty
            return false;
        } else if (!(typeof query["OPTIONS"]["ORDER"] === "undefined")) {
            if (typeof query["OPTIONS"]["ORDER"] === "string") {
                if (!(PerformQueryChecks.syntaxCheck(query["OPTIONS"]["ORDER"], query))) {
                    return false;
                } else if (!(query["OPTIONS"]["COLUMNS"].includes(query["OPTIONS"]["ORDER"]))) {
                    return false;
                }
            } else if (query["OPTIONS"]["ORDER"] === null) {
                return false;
            } else if (Object.keys(query["OPTIONS"]["ORDER"]).length === 2) {
                if (!(this.checkOrderObject(query["OPTIONS"]["ORDER"], query))) {
                    return false;
                }
            } else {
                return false; // type of order is not a string, null or a object
            }
        }
        let coursesCount = 0;
        let roomsCount = 0;
        for (let eachOption of query["OPTIONS"]["COLUMNS"]) {
            if (typeof eachOption !== "string") {
                return false;
            }
            if (eachOption.includes("courses")) {
                coursesCount++;
            } else if (eachOption.includes("rooms")) {
                roomsCount++;
            }
            if (coursesCount > 0 && roomsCount > 0) {
                return false;
            }
            if (!(PerformQueryChecks.syntaxCheck(eachOption, query))) {
                return false;
            }
        }
        if (!(this.checkGroupApplyColumns(query))) {
            return false;
        }
        return true;
    }

    private static checkGroupApplyColumns(query: any): boolean {
        if (typeof query["TRANSFORMATIONS"] === "undefined") {
            return true;
        }
        let applyList: any[] = [];
        for (let each of query["TRANSFORMATIONS"]["APPLY"]) {
            applyList.push(Object.keys(each)[0]);
        }
        let groupApply = query["TRANSFORMATIONS"]["GROUP"].concat(applyList);
        for (let each of query["OPTIONS"]["COLUMNS"]) {
            if (!groupApply.includes(each)) {
                return false;
            }
        }
        // if (query["OPTIONS"]["COLUMNS"].length !== groupApply.length) {
        //     console.log("dog18");
        //     return false;
        // }
        return true;
    }

    public static checkOrderObject(obj: any, query: any): boolean {
        if ((!(typeof obj["dir"] === "undefined")) && (!(typeof obj["keys"] === "undefined"))) {
            if (Array.isArray(obj["dir"])) {
                return false;
            } else if (!((Object.keys(obj)[0] === "dir") && (Object.keys(obj)[1] === "keys"))) {
                return false;
            } else if ((!(obj["dir"] === "DOWN")) && (!(obj["dir"] === "UP"))) {
                return false;
            }
            if (!(Array.isArray(obj["keys"]))) {
                return false;
            }
            for (let each of obj["keys"]) {
                if (!(query["OPTIONS"]["COLUMNS"].includes(each))) {
                    return false;
                }
            }
            let coursesCount = 0;
            let roomsCount = 0;
            for (let each of obj["keys"]) {
                if (each.includes("courses")) {
                    coursesCount++;
                } else if (each.includes("rooms")) {
                    roomsCount++;
                }
                if (coursesCount > 0 && roomsCount > 0) {
                    return false;
                }
                if (!(PerformQueryChecks.syntaxCheck(each, query))) {
                    return false;
                }
            }
            return true;
        }
    }
}
