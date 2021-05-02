export default class PerformQueryTransformationsCheck {
    public static listOfNewNumberKeys(applyArr: any[]): string[] {
        let result: string[] = [];
        for (let each of applyArr) {
            if (this.checkApplySyntax(each, "number", Object.keys(each)[0])) {
                result.push(Object.keys(each)[0]);
            }
        }
        return result;
    }

    public static listOfNewStringKeys(applyArr: any[]): string[] {
        let result: string[] = [];
        for (let each of applyArr) {
            if (this.checkApplySyntax(each, "string", Object.keys(each)[0])) {
                result.push(Object.keys(each)[0]);
            }
        }
        return result;
    }

    public static isTransformationValid(query: any): boolean {
        if (typeof query["TRANSFORMATIONS"] === "undefined") {
            return true;
        } else if (Array.isArray(query["TRANSFORMATIONS"])) {
            return false;
        } else if ((typeof query["TRANSFORMATIONS"]["GROUP"] === "undefined") ||
            (typeof query["TRANSFORMATIONS"]["APPLY"] === "undefined")) {
            return false;
        } else if (!(Array.isArray(query["TRANSFORMATIONS"]["GROUP"]))) {
            return false;
        } else if (!(Array.isArray(query["TRANSFORMATIONS"]["APPLY"]))) {
            return false;
        } else if (!(Object.keys(query["TRANSFORMATIONS"]).length === 2)) {
            return false;
        }
        for (let each of query["TRANSFORMATIONS"]["GROUP"]) {
            if (!(this.groupSyntax(each))) {
                return false;
            }
        }
        let listOfNew: any[] = [];
        for (let each of query["TRANSFORMATIONS"]["APPLY"]) {
            listOfNew.push(Object.keys(each).toString());
        }
        if (this.duplicates(listOfNew)) {
            return false;
        }
        return true;
    }

    private static duplicates(array: any[]): boolean {
        let alreadySeen = [];

        for (let each of array) {
            if (alreadySeen.indexOf(each) !== -1) {
                return true;
            }
            alreadySeen.push(each);
        }
        return false;
    }

    private static groupSyntax(groupElement: any): boolean {
        let listOfValidKeys: any[] = [];
        if (groupElement.includes("courses")) {
            listOfValidKeys = ["courses_dept", "courses_id", "courses_avg", "courses_instructor", "courses_title",
                "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year"];
        } else if (groupElement.includes("rooms")) {
            listOfValidKeys = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                "rooms_lat", "rooms_lon", "rooms_seats", "rooms_type", "rooms_furniture", "rooms_href"];
        }
        for (let eachValidKey of listOfValidKeys) {
            if (typeof groupElement !== "string") {
                return false;
            }
            if (groupElement.valueOf() === eachValidKey.valueOf()) {
                return true;
            }
        }
        return false;
    }

    private static checkApplySyntax(applyArrElement: any, type: string, newName: any): boolean {
        let listOfValidKeys: any[] = [];
        if (typeof applyArrElement === "undefined" || applyArrElement === null ||
            (!(typeof applyArrElement === "object"))) {
            return false;
        } else if (Object.keys(applyArrElement).length !== 1) {
            return false;
        }
        if (type === "number") {
            if ((Object.values(Object.values(applyArrElement)[0]).toString()).includes("courses")) {
                listOfValidKeys = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
            } else if (Object.values(Object.values(applyArrElement)[0]).toString().includes("rooms")) {
                listOfValidKeys = ["rooms_lat", "rooms_lon", "rooms_seats"];
            }
            for (let each of ["MAX", "MIN", "AVG", "SUM", "COUNT"]) {
                if ((Object.keys(applyArrElement[newName])).includes(each)) {
                    for (let eachKey of listOfValidKeys) {
                        if ((Object.values(Object.values(applyArrElement)[0])).includes(eachKey)) {
                            return true;
                        }
                    }
                }
            }
        } else if (type === "string") {
            if ((Object.values(Object.values(applyArrElement)[0]).toString()).includes("courses")) {
                listOfValidKeys = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid"];
            } else if (Object.values(Object.values(applyArrElement)[0]).toString().includes("rooms")) {
                listOfValidKeys = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                    "rooms_type", "rooms_furniture", "rooms_href"];
            }
            for (let each of ["COUNT"]) {
                if ((Object.keys(applyArrElement[newName])).includes(each)) {
                    for (let eachKey of listOfValidKeys) {
                        if ((Object.values(Object.values(applyArrElement)[0])).includes(eachKey)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
