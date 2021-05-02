import PerformQueryTransformationsCheck from "./PerformQueryTransformationsCheck";
import PerformQueryWildcardManager from "./PerformQueryWildcardManager";
export default class PerformQueryChecks {
    // return true if there is only body and options, else return false
    public static checkTopLevel(query: any): boolean {
        if (Object.keys(query).length !== 2) {
            if (typeof query["TRANSFORMATIONS"] === "undefined" || Object.keys(query).length !== 3) {
                return false;
            }
        }
        if (typeof query["WHERE"] === "undefined" || typeof query["OPTIONS"] === "undefined") {
            return false;
        }
        return true;
    }

    public static syntaxCheck(key: any, query: any): boolean {
        // returns false if type is wrong, true if it exists
        let newNumberKeys: any[] = [], newStringKeys: any[] = [], listOfPossibleKeys: any[] = [];
        if (!(typeof query["TRANSFORMATIONS"] === "undefined")) {
            newNumberKeys = PerformQueryTransformationsCheck.listOfNewNumberKeys(query["TRANSFORMATIONS"]["APPLY"]);
            newStringKeys = PerformQueryTransformationsCheck.listOfNewStringKeys(query["TRANSFORMATIONS"]["APPLY"]);
        }
        let newKeys = newNumberKeys.concat(newStringKeys);
        if (key.includes("courses")) {
            listOfPossibleKeys = ["courses_dept", "courses_id", "courses_avg", "courses_instructor",
                "courses_title", "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year"]
                .concat(newKeys);
        } else if (key.includes("rooms")) {
            listOfPossibleKeys = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name",
                "rooms_address", "rooms_lat", "rooms_lon", "rooms_seats", "rooms_type", "rooms_furniture", "rooms_href"]
                .concat(newKeys);
        } else if ((newNumberKeys.includes(key)) || (newStringKeys.includes(key))) {
            return true;
        }
        for (let each of listOfPossibleKeys) {
            if (typeof key !== "string") {
                return false;
            }
            if (key === each) {
                return true;
            }
        }
        return false;
    }

    public static isBodyValid(query: any): boolean {
        if (!(typeof query["WHERE"] === "object")) {
            return false;
        } else if (query["WHERE"] === null || typeof query["WHERE"] === "undefined") {
            return false;
        }
        if (Object.keys(query["WHERE"]).length === 0) {
            return true;
        }
        if (!(typeof query["WHERE"]["AND"] === "undefined")) {
            if (!(this.andOrHelper(query["WHERE"]["AND"], query))) { // and has an error
                return false;
            }
        } else if (!(typeof query["WHERE"]["OR"] === "undefined")) {
            if (!(this.andOrHelper(query["WHERE"]["OR"], query))) {
                return false;
            }
        } else if (!(typeof query["WHERE"]["LT"] === "undefined")) {
            if (!(this.runLtGtEq(query["WHERE"]["LT"], query))) {
                return false;
            }
        } else if (!(typeof query["WHERE"]["GT"] === "undefined")) {
            if (!(this.runLtGtEq(query["WHERE"]["GT"], query))) {
                return false;
            }
        } else if (!(typeof query["WHERE"]["EQ"] === "undefined")) {
            if (!(this.runLtGtEq(query["WHERE"]["EQ"], query))) {
                return false;
            }
        } else if (!(typeof query["WHERE"]["NOT"] === "undefined")) {
            if (!(this.notHelperFunction(query["WHERE"]["NOT"], query))) {
                return false;
            }
        } else if (!(typeof query["WHERE"]["IS"] === "undefined")) {
            if (!(this.isHelperFunction(query["WHERE"]["IS"], query))) {
                return false;
            }
        } else { // where contains something that is not one of the 7 filter options
            return false;
        }
        return true;
    }

    public static andOrHelper(arr: any[], query: any): boolean {
        if (!(Array.isArray(arr))) {
            return false;
        } else if (arr.length === 0) {
            return false;
        }
        for (let each of arr) {
            if (!(this.correctTypesHelper(each, query))) {
                return false;
            }
        }
        return true;
    }

    public static correctTypesHelper(obj: any, query: any): boolean {
        if (!(typeof obj["AND"] === "undefined")) {
            return this.andOrHelper(obj["AND"], query);
        } else if (!(typeof obj["OR"] === "undefined")) {
            return this.andOrHelper(obj["OR"], query);
        } else if (!(typeof obj["LT"] === "undefined")) {
            return this.runLtGtEq(obj["LT"], query);
        } else if (!(typeof obj["GT"] === "undefined")) {
            return this.runLtGtEq(obj["GT"], query);
        } else if (!(typeof obj["EQ"] === "undefined")) {
            return this.runLtGtEq(obj["EQ"], query);
        } else if (!(typeof obj["NOT"] === "undefined")) {
            return this.notHelperFunction(obj["NOT"], query);
        } else if (!(typeof obj["IS"] === "undefined")) {
            return this.isHelperFunction(obj["IS"], query);
        } else { // where contains something that is not one of the 7 filter options
            return false;
        }
    }

    public static ltGtEqHelper(obj: any, query: any): boolean { // returns false if comparing to string type
        let invalidNewType: any[] = [];
        let validNewTypes: any[] = [];
        let validType: any[] = [];
        if (!(typeof query["TRANSFORMATIONS"] === "undefined")) {
            invalidNewType = PerformQueryTransformationsCheck.listOfNewStringKeys(query["TRANSFORMATIONS"]["APPLY"]);
            validNewTypes = PerformQueryTransformationsCheck.listOfNewNumberKeys(query["TRANSFORMATIONS"]["APPLY"]);
        }
        let invalidType = ["courses_dept", "courses_id", "courses_instructor", "courses_title",
            "courses_uuid", "rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
            "rooms_type", "rooms_furniture", "rooms_href"].concat(invalidNewType);
        for (let each of invalidType) {
            if (!(typeof obj[each] === "undefined")) {
                return false;
            }
        }
        if (Object.keys(obj).toString().includes("courses")) {
            validType = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"]
                .concat(validNewTypes);
        } else if (Object.keys(obj).toString().includes("rooms")) {
            validType = ["rooms_lat", "rooms_lon", "rooms_seats"].concat(validNewTypes);
        }
        let count = 0;
        for (let each of validType) {
            if (!(typeof obj[each] === "undefined")) {
                count++;
            }
        }
        if (count === 0 || count > 1) {
            return false;
        }
        return true;
    }

    public static runLtGtEq(obj: any, query: any): boolean {
        if (!(typeof obj === "object")) { // what is inside of eq is not an object
            return false;
        } else if (Array.isArray(obj)) {
            return false;
        } else if (Object.keys(obj).length === 0) {
            return false;
        } else if (!(typeof obj["AND"] === "undefined")) { // lt contains and
            return false;
        } else if (!(typeof obj["OR"] === "undefined")) { // lt contains or
            return false;
        } else if (!(this.ltGtEqHelper(obj, query))) { // comparing to string type
            return false;
        } else if (!(this.compatibleTypes(obj, query))) { // ensuring the objects are compared to the right type
            return false;
        }
        return true;
    }

    public static notHelperFunction(notObject: any, query: any): boolean {
        if (!(typeof notObject === "object")) { // whats inside of not is not an object
            return false;
        } else if (Array.isArray(notObject)) {
            return false;
        } else if (Object.keys(notObject).length === 0) {
            return false;
        } else if (!(this.compatibleTypes(notObject, query))) { // ensures the object is compared to the right type
            return false;
        }
        return this.correctTypesHelper(notObject, query);
    }

    public static isHelperFunction(isObject: any, query: any): boolean {
        let newInvalidTypes: any[] = [];
        let validNewTypes: any[] = [];
        let validType: any[] = [];
        if (!(typeof query["TRANSFORMATIONS"] === "undefined")) {
            newInvalidTypes = PerformQueryTransformationsCheck.listOfNewNumberKeys(query["TRANSFORMATIONS"]["APPLY"]);
            validNewTypes = PerformQueryTransformationsCheck.listOfNewStringKeys(query["TRANSFORMATIONS"]["APPLY"]);
        }
        let invalidTypes = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year",
            "rooms_lat", "rooms_lon", "rooms_seats"].concat(newInvalidTypes);
        if (!(typeof isObject === "object")) {
            return false;
        } else if (Array.isArray(isObject)) {
            return false;
        } else if (Object.keys(isObject).length === 0) {
            return false;
        } else if (!(typeof isObject["AND"] === "undefined")) {
            return false;
        } else if (!(typeof isObject["OR"] === "undefined")) {
            return false;
        } else if (!(this.compatibleTypes(isObject, query))) {
            return false;
        } else if (!(PerformQueryWildcardManager.wildcards(isObject))) {
            return false;
        }
        for (let each of invalidTypes) {
            if (!(typeof isObject[each] === "undefined")) {
                return false;
            }
        }
        if (Object.keys(isObject).toString().includes("courses")) {
            validType = ["courses_dept", "courses_id", "courses_instructor", "courses_title",
                "courses_uuid"]
                .concat(validNewTypes);
        } else if (Object.keys(isObject).toString().includes("rooms")) {
            validType = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_type", "rooms_furniture", "rooms_href"].concat(validNewTypes);
        }
        let count = 0;
        for (let each of validType) {
            if (!(typeof isObject[each] === "undefined")) {
                count++;
            }
        }
        if (count === 0 || count > 1) {
            return false;
        }
        return true;
    }

    public static compatibleTypes(obj: any, query: any): boolean {
        // returns true if the object is the correct type
        let newStringTypes: any[] = [], newNumberTypes: any[] = [], stringTypes: any[] = [], numberTypes: any[] = [];
        if (!(typeof query["TRANSFORMATIONS"] === "undefined")) {
            newStringTypes = PerformQueryTransformationsCheck.listOfNewStringKeys(query["TRANSFORMATIONS"]["APPLY"]);
            newNumberTypes = PerformQueryTransformationsCheck.listOfNewNumberKeys(query["TRANSFORMATIONS"]["APPLY"]);
        }
        if (Object.keys(obj).toString().includes("courses")) {
            stringTypes = ["courses_dept", "courses_id", "courses_instructor", "courses_title",
                "courses_uuid"].concat(newStringTypes);
            numberTypes = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"]
                .concat(newNumberTypes);
        } else if (Object.keys(obj).toString().includes("rooms")) {
            stringTypes = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_type", "rooms_furniture", "rooms_href"].concat(newStringTypes);
            numberTypes = ["rooms_lat", "rooms_lon", "rooms_seats"]
                .concat(newNumberTypes);
        }
        for (let each of stringTypes) {
            if (!(typeof obj[each] === "undefined")) {
                if (!(typeof obj[each] === "string")) {
                    return false;
                }
            }
        }
        for (let each of numberTypes) {
            if (!(typeof obj[each] === "undefined")) {
                if (!(typeof obj[each] === "number")) {
                    return false;

                }
            }
        }
        return true;
    }
}
