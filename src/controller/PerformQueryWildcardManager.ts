export default class PerformQueryWildcardManager {
    public static wildcards(isObject: any): boolean {
        let keyString = "";
        if (typeof isObject["courses_dept"] === "string") {
            keyString = isObject["courses_dept"];
        } else if (!(typeof isObject["courses_id"] === "undefined")) {
            keyString = isObject["courses_id"];
        } else if (!(typeof isObject["courses_instructor"] === "undefined")) {
            keyString = isObject["courses_instructor"];
        } else if (!(typeof isObject["courses_title"] === "undefined")) {
            keyString = isObject["courses_title"];
        } else if (!(typeof isObject["courses_uuid"] === "undefined")) {
            keyString = isObject["courses_uuid"];
        } else if (!(typeof isObject["rooms_fullname"] === "undefined")) {
            keyString = isObject["rooms_fullname"];
        } else if (!(typeof isObject["rooms_shortname"] === "undefined")) {
            keyString = isObject["rooms_shortname"];
        } else if (!(typeof isObject["rooms_number"] === "undefined")) {
            keyString = isObject["rooms_number"];
        } else if (!(typeof isObject["rooms_name"] === "undefined")) {
            keyString = isObject["rooms_name"];
        } else if (!(typeof isObject["rooms_address"] === "undefined")) {
            keyString = isObject["rooms_address"];
        } else if (!(typeof isObject["rooms_type"] === "undefined")) {
            keyString = isObject["rooms_type"];
        } else if (!(typeof isObject["rooms_furniture"] === "undefined")) {
            keyString = isObject["rooms_furniture"];
        } else if (!(typeof isObject["rooms_href"] === "undefined")) {
            keyString = isObject["rooms_href"];
        } else {
            return true;
        }
        return this.wildcardHelper(keyString);
    }

    public static wildcardHelper(keyString: string): boolean {
        if (keyString.includes("***")) {
            return false;
        }
        let arr: string[] = [];
        for (let i = 0; i < keyString.length; i++) {
            if (i === keyString.length - 1) {
                arr[i] = keyString.substring(i);
            }
            arr[i] = keyString.substring(i, i + 1);
        }
        for (let i = 1; i < keyString.length - 1; i++) {
            if (arr[i - 1] !== "*" && arr[i] === "*" && arr[i + 1] === "*") {
                return false;
            } else if (arr[i - 1] === "*" && arr[i] === "*" && arr[i + 1] !== "*") {
                return false;
            } else if (arr[i - 1] !== "*" && arr[i] === "*" && arr[i + 1] !== "*") {
                return false;
            }
        }
        return true;
    }
}
