"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const parsingInRooms_1 = require("./parsingInRooms");
const parse5 = require("parse5");
const http = require("http");
function parseBuildings(id, content, tree, zip) {
    Util_1.default.trace("parseBuildings");
    try {
        let indexTree = parse5.parse(tree);
        let table = findTable(indexTree);
        if (table === 0) {
            throw new IInsightFacade_1.InsightError("failed traversal");
        }
        return Promise.resolve(table);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.parseBuildings = parseBuildings;
function findTable(indexTree) {
    if (indexTree.nodeName === "tbody" && indexTree.childNodes.length > 0) {
        for (let trs of indexTree.childNodes) {
            if (trs.nodeName === "tr") {
                return indexTree;
            }
        }
        return 0;
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let table = findTable(child);
            if (table !== 0) {
                return table;
            }
        }
    }
    return 0;
}
function loopTree(id, node, object1, zip, objList) {
    Util_1.default.trace("loopTree");
    let promises = [];
    for (let trs of node.childNodes) {
        if (trs.nodeName === "tr" && trs.childNodes.length > 0) {
            let href = findBuildingorRoomsHREF(trs);
            let fullname = findBuildingFullName(trs);
            let buildingcode = findBuildingCode(trs);
            let address = findBuildingAddress(trs);
            if (href !== null && fullname !== null
                && buildingcode !== null && address !== null) {
                let re = /\./gi;
                let accessRooms = href.replace(re, "rooms");
                try {
                    promises.push(zip.files[accessRooms].async("string").then((rooms) => {
                        try {
                            let parseTable = parse5.parse(rooms);
                            let table = findTable(parseTable);
                            if (table !== 0) {
                                return loopRoomTree(id, table, object1, fullname, buildingcode, address, objList);
                            }
                        }
                        catch (e) {
                            Util_1.default.trace("Error");
                        }
                    }));
                }
                catch (e) {
                    Util_1.default.trace(e);
                }
            }
        }
    }
    return Promise.all(promises).then((r) => {
        return Promise.resolve(r);
    });
}
exports.loopTree = loopTree;
function loopRoomTree(id, roomContent, object1, fullname, buildingcode, address, objList) {
    return new Promise(function (resolve, reject) {
        let encodedAddress = address.replace(/ /gi, "%20");
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team069/" + encodedAddress;
        let objList1 = [];
        http.get(url, (res) => {
            let resdata = "";
            res.on("data", (data) => (resdata += data));
            res.on("end", () => {
                try {
                    let locationValue = JSON.parse(resdata);
                    if (locationValue["error"] === undefined) {
                        parseRoomsAndAdd(roomContent, buildingcode, id, fullname, address, locationValue, objList1, objList);
                        return resolve(objList1);
                    }
                }
                catch (e) {
                    Util_1.default.trace(e);
                }
            });
        });
    });
}
function parseRoomsAndAdd(roomContent, buildingcode, id, fullname, address, locationValue, objList1, objList) {
    for (let trs of roomContent.childNodes) {
        if (trs.nodeName === "tr" && trs.childNodes.length > 0) {
            let object2 = {};
            let furniture = parsingInRooms_1.findRoomFurniture(trs);
            let numSeats = parsingInRooms_1.findRoomsSeats(trs);
            if (numSeats === "") {
                numSeats = "0";
            }
            let roomNumber = parsingInRooms_1.findRoomsNumber(trs);
            let roomType = parsingInRooms_1.findRoomsType(trs);
            let roomsHREF = findBuildingorRoomsHREF(trs);
            let roomName = buildingcode + "_" + roomNumber;
            if (furniture !== null && numSeats !== -1 && roomNumber !== null
                && roomType !== null && roomsHREF !== null) {
                object2[id + "_fullname"] = fullname;
                object2[id + "_shortname"] = buildingcode;
                object2[id + "_address"] = address;
                object2[id + "_furniture"] = furniture;
                object2[id + "_seats"] = parseInt(numSeats, 10);
                object2[id + "_number"] = roomNumber;
                object2[id + "_type"] = roomType;
                object2[id + "_href"] = roomsHREF;
                object2[id + "_name"] = roomName;
                object2[id + "_lat"] = locationValue["lat"];
                object2[id + "_lon"] = locationValue["lon"];
                objList1.push(object2);
                objList.push(object2);
            }
        }
    }
}
function findBuildingCode(indexTree) {
    if (indexTree.nodeName === "td" &&
        indexTree.attrs[0].value.startsWith("views-field views-field-field-building-code")) {
        return indexTree.childNodes[0].value.trim();
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingCode = findBuildingCode(child);
            if (buildingCode !== null) {
                return buildingCode;
            }
        }
    }
    return null;
}
function findBuildingFullName(indexTree) {
    if (indexTree.nodeName === "a"
        && indexTree.attrs[1].name.startsWith("title") && indexTree.childNodes[0].nodeName === "#text") {
        return indexTree.childNodes[0].value;
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let fullName = findBuildingFullName(child);
            if (fullName !== null) {
                return fullName;
            }
        }
    }
    return null;
}
function findBuildingorRoomsHREF(indexTree) {
    if (indexTree.nodeName === "a" &&
        indexTree.attrs[0].name.startsWith("href")) {
        return indexTree.attrs[0].value.trim();
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingHREF = findBuildingorRoomsHREF(child);
            if (buildingHREF !== null) {
                return buildingHREF;
            }
        }
    }
    return null;
}
function findBuildingAddress(indexTree) {
    if (indexTree.nodeName === "td" &&
        indexTree.attrs[0].value.startsWith("views-field views-field-field-building-address")) {
        return indexTree.childNodes[0].value.trim();
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingAddress = findBuildingAddress(child);
            if (buildingAddress !== null) {
                return buildingAddress;
            }
        }
    }
    return null;
}
function parseCoursesAndAdd(courses, fetchData, id, objList) {
    let numRows = 0;
    for (let course of courses) {
        try {
            fetchData = JSON.parse(course);
            if (fetchData.hasOwnProperty("result") && fetchData.result) {
                for (let section of fetchData.result) {
                    let object1 = {};
                    if (section.hasOwnProperty("Title") && section.hasOwnProperty("id")
                        && section.hasOwnProperty("Professor")
                        && section.hasOwnProperty("Audit") && section.hasOwnProperty("Year")
                        && section.hasOwnProperty("Course") && section.hasOwnProperty("Pass")
                        && section.hasOwnProperty("Fail")
                        && section.hasOwnProperty("Avg")
                        && section.hasOwnProperty("Subject")) {
                        object1[id + "_title"] = section["Title"];
                        object1[id + "_uuid"] = section["id"].toString();
                        object1[id + "_instructor"] = section["Professor"];
                        object1[id + "_audit"] = section["Audit"];
                        object1[id + "_year"] = parseInt(section["Year"], 10);
                        object1[id + "_id"] = section["Course"];
                        object1[id + "_pass"] = section["Pass"];
                        object1[id + "_fail"] = section["Fail"];
                        object1[id + "_avg"] = section["Avg"];
                        object1[id + "_dept"] = section["Subject"];
                        if (section["Section"] && (section["Section"] === "overall")) {
                            object1[id + "_year"] = 1900;
                        }
                        numRows += 1;
                        objList.push(object1);
                    }
                }
            }
        }
        catch (e) {
            Util_1.default.trace(e);
        }
    }
    return numRows;
}
exports.parseCoursesAndAdd = parseCoursesAndAdd;
//# sourceMappingURL=parseAdd.js.map