/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    let kind = "";
    if (document.getElementById("tab-courses").getAttribute("class") === "tab-panel active") {
        kind = "courses";
    } else if (document.getElementById("tab-rooms").getAttribute("class") === "tab-panel active") {
        kind = "rooms";
    }
    whereFunction(kind);
    orderFunction(kind);
    columnFunction(kind);
    groupAndApplyFunction(kind);

    //console.log("CampusExplorer.buildQuery not implemented yet.");
    return query;

    function orderFunction(kind) {
        let orderList = document.getElementById("tab-" + kind).getElementsByClassName
        ("control order fields")[0].querySelectorAll("option[selected]");
        if (orderList.length === 0) {
            return;
        } else {
            let dir = document.getElementById("tab-" + kind).getElementsByClassName
            ("control descending")[0].querySelector("input[type]").checked;
            if (dir === true) {
                query["OPTIONS"] = {};
                query["OPTIONS"]["ORDER"] = {};
                query["OPTIONS"]["ORDER"]["dir"] = {};
                query["OPTIONS"]["ORDER"]["dir"] = "DOWN";
                query["OPTIONS"]["ORDER"]["keys"] = [];
            } else {
                if (orderList.length === 1) {
                    query["OPTIONS"] = {};
                    query["OPTIONS"]["ORDER"] = kind + "_" + orderList[0].value;
                    return;
                } else {
                    query["OPTIONS"] = {};
                    query["OPTIONS"]["ORDER"] = {};
                    query["OPTIONS"]["ORDER"]["dir"] = {};
                    query["OPTIONS"]["ORDER"]["dir"] = "UP";
                    query["OPTIONS"]["ORDER"]["keys"] = [];
                }
            }
            let preSelectedOptions = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid",
                "year", "fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
                "furniture", "href"];
            for (let each of orderList) {
                if (preSelectedOptions.includes(each.value)) {
                    query["OPTIONS"]["ORDER"]["keys"].push(kind + "_" + each.value);
                } else {
                    query["OPTIONS"]["ORDER"]["keys"].push(each.value);
                }
            }
        }
    }

    function columnFunction(kind) {
        let allColumns = document.getElementById("tab-" + kind).getElementsByClassName
        ("form-group columns")[0].getElementsByClassName("control-group")[0]
            .getElementsByClassName("control field");
        let transformationColumns = document.getElementById("tab-" + kind).getElementsByClassName
        ("form-group columns")[0].getElementsByClassName("control-group")[0]
            .getElementsByClassName("control transformation");
        if (typeof query["OPTIONS"] === "undefined") {
           query["OPTIONS"] = {};
        }
        query["OPTIONS"]["COLUMNS"] = [];
        for (let each of allColumns) {
            if (each.querySelector("input[type=checkbox]").checked === true) {
                query["OPTIONS"]["COLUMNS"].push(kind + "_" + each.querySelector("input[type=checkbox]").value);
            }
        }
        for (let each of transformationColumns) {
            if (each.querySelector("input[type=checkbox]").checked === true) {
                query["OPTIONS"]["COLUMNS"].push(each.querySelector("input[type=checkbox]").value);
            }
        }
    }

    function whereFunction(kind) {
        query["WHERE"] = {};
        let fullQuery = [];
        let outsideCond = "";
        if (document.getElementById("tab-" + kind).getElementsByClassName("control-group condition-type")[0]
            .querySelector("input[checked]").value === "all") {
            outsideCond = "AND";
        } else if (document.getElementById("tab-" + kind).getElementsByClassName("control-group condition-type")[0]
            .querySelector("input[checked]").value === "any") {
            outsideCond = "OR";
        } else if (document.getElementById("tab-" + kind).getElementsByClassName("control-group condition-type")[0]
            .querySelector("input[checked]").value === "none") {
            outsideCond = "NOT";
        }
        let insideConds = document.getElementById("tab-" + kind).getElementsByClassName("control-group condition");
        if (insideConds.length === 0) {
            return;
        } else {
            for (let each of insideConds) {
                let currPartOfQuery = {};
                let not = null;
                if (each.querySelector("input[type=checkbox]").checked) {
                    not = true;
                }
                let key = kind + "_" + each.getElementsByClassName("control fields")[0]
                    .querySelector("option[selected=selected]").value;
                let operation = each.getElementsByClassName("control operators")[0]
                    .querySelector("option[selected=selected]").value;
                let term = each.getElementsByClassName("control term")[0]
                    .querySelector("input[type=text]").value;
                if (operation !== "IS") {
                    term = Number(term);
                }
                currPartOfQuery[operation] = {};
                currPartOfQuery[operation][key] = term;
                if (not === true) {
                    currPartOfQuery = {"NOT": currPartOfQuery};
                }
                fullQuery.push(currPartOfQuery);
            }
        }
        if (fullQuery.length === 0) {
            return;
        } else if (fullQuery.length === 1) {
            if (outsideCond === "NOT") {
                query["WHERE"]["NOT"] = fullQuery[0];
                return;
            } else {
                query["WHERE"] = fullQuery[0];
                return;
            }
        } else {
            if (outsideCond === "NOT") {
                query["WHERE"] = {}
                query["WHERE"]["NOT"] = {"OR": fullQuery};
            } else if (outsideCond === "OR") {
                query["WHERE"] = {}
                query["WHERE"]["OR"] = fullQuery;
            } else if (outsideCond === "AND") {
                query["WHERE"] = {}
                query["WHERE"]["AND"] = fullQuery;
            }
        }
    }

    function groupAndApplyFunction(kind) {
        let selectedGroup = document.getElementById("tab-" + kind).getElementsByClassName
        ("form-group groups")[0].getElementsByClassName("control field");
        query["TRANSFORMATIONS"] = {};
        query["TRANSFORMATIONS"]["GROUP"] = [];
        for (let each of selectedGroup) {
            if (each.querySelector("input[type]").checked) {
                query["TRANSFORMATIONS"]["GROUP"].push(kind + "_" + each.querySelector("input[type]").value);
            }
        }
        let finalApplyArray = [];
        let apply = document.getElementById("tab-" + kind).getElementsByClassName
        ("form-group transformations")[0].getElementsByClassName("control-group transformation");
        for (let each of apply) {
            let thisApplyObj = {};
            let name = each.querySelector("input[type]").value;
            let operation = each.getElementsByClassName("control operators")[0]
                .querySelector("option[selected= selected]").value;
            thisApplyObj[name] = {};
            thisApplyObj[name][operation] = kind + "_" + each.getElementsByClassName("control fields")[0]
                .querySelector("option[selected=selected]").value;
            finalApplyArray.push(thisApplyObj);
        }
        query["TRANSFORMATIONS"]["APPLY"] = [];
        for (let each of finalApplyArray) {
            query["TRANSFORMATIONS"]["APPLY"].push(each);
        }
        if (query["TRANSFORMATIONS"]["GROUP"].length === 0 || query["TRANSFORMATIONS"]["APPLY"].length === 0) {
            query["TRANSFORMATIONS"] = undefined;
        }
    }
};
