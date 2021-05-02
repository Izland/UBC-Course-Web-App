/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        try {
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", "/query");
            xmlhttp.setRequestHeader("Content-Type", "application/json");
            xmlhttp.onload = function () {
                if (xmlhttp.status === 200 || xmlhttp.status === 400) {
                    resolve(JSON.parse(xmlhttp.response));
                } else {
                    reject(xmlhttp.status);
                }
            }
            xmlhttp.send(JSON.stringify(query));
        } catch (error) {
            reject({error: error});
        }
        // console.log("CampusExplorer.sendQuery not implemented yet.");
    });
};
