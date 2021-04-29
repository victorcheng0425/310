"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const JSZip = require("jszip");
const parse5 = require("parse5");
let that = this;
function parseBuildings(id, content, objList) {
    let object1 = {};
    let buildingsWeNeed = [];
    JSZip.loadAsync(content, { base64: true }).then(function (zip) {
        let folder = zip.folder("rooms");
        folder.file("index.htm").async("string").then(function (tree) {
            try {
                Util_1.default.trace(tree);
                let indexTree = parse5.parse(tree);
                loopTree(id, indexTree, buildingsWeNeed, object1);
            }
            catch (e) {
                Util_1.default.trace(tree);
            }
        }).then(folder.file("campus/discover/buildings-and-classrooms/").
            forEach(function (relativePath, file) {
            let campusTree = parse5.parse(file);
            try {
                Util_1.default.trace(file);
                parseRooms(id, campusTree, buildingsWeNeed, object1);
            }
            catch (e) {
                Util_1.default.trace(e);
            }
        }));
    });
    return 0;
}
exports.parseBuildings = parseBuildings;
function loopTree(id, node, buildingsWeNeed, object1) {
    if (allKeysPresent(id, object1)) {
        buildingsWeNeed.push(object1[id + "_shortname"]);
        return buildingsWeNeed;
    }
    if (node.childNodes && node.childNodes.length > 0) {
        for (let child of node.childNodes) {
            parseIndex(id, node, buildingsWeNeed, object1);
        }
    }
}
function allKeysPresent(id, object1) {
    if (!object1[id + "_shortname"] || !object1[id + "_fullname"]
        || !object1[id + "_href"] || !object1[id + "_address"]) {
        return 0;
    }
    else {
        return 1;
    }
}
function findBuildingCode(indexTree) {
    if (indexTree.nodeName === "td" &&
        indexTree.attrs[0].value.startsWith("views-field views-field-field-building-code")) {
        return indexTree.childNodes[0].value;
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingCode = findBuildingCode(indexTree.childNodes);
            if (indexTree !== "") {
                return buildingCode;
            }
        }
    }
    return "";
}
function findBuildingHREF(indexTree) {
    return "";
}
function findBuildingFullName(indexTree) {
    return "";
}
function findBuildingTitle(indexTree) {
    if (indexTree.nodeName === "td" && indexTree.childNodes &&
        indexTree.attrs[0].name.startsWith("views-field views-field-title")) {
        for (let child of indexTree.childNodes) {
            findBuildingHREF(indexTree.childNodes);
            findBuildingFullName(indexTree.childNodes);
        }
    }
    if (indexTree.nodeName === "a") {
        if (indexTree.attrs[0].name.startsWith("href")) {
            return indexTree.attrs[0].value;
        }
        if (indexTree.attrs[0].name.startsWith("title")) {
            return indexTree.childNodes[0].value;
        }
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingHREF = findBuildingTitle(indexTree.childNodes);
            let buildingTitle = findBuildingTitle(indexTree.childNodes);
            if (buildingHREF !== "") {
                return buildingTitle;
            }
        }
    }
    return "";
}
function findBuildingAddress(indexTree) {
    if (indexTree.nodeName === "td" &&
        indexTree.attrs[0].value.startsWith("views-field views-field-field-building-address")) {
        return indexTree.childNodes[0].value;
    }
    if (indexTree.childNodes && indexTree.childNodes.length > 0) {
        for (let child of indexTree.childNodes) {
            let buildingCode = findBuildingCode(indexTree.childNodes);
            if (indexTree !== "") {
                return buildingCode;
            }
        }
    }
    return "";
}
function parseIndex(id, indexTree, buildingsWeNeed, object1) {
    if (indexTree.nodeName === "td") {
        if (indexTree.attrs[0].value.startsWith("views-field views-field-field-building-code")) {
            object1[id + "_shortname"] = indexTree.childNodes[0].value;
        }
        if (indexTree.attrs[0].name.startsWith("views-field views-field-title")) {
            object1[id + "_fullname"] = parseIndex(id, indexTree.childNodes, buildingsWeNeed, object1);
            object1[id + "_href"] = parseIndex(id, indexTree.childNodes, buildingsWeNeed, object1);
        }
        if (indexTree.attrs[0].value.startsWith("views-field views-field-field-building-address")) {
            object1[id + "_address"] = indexTree.childNodes[0].value;
        }
    }
    if (indexTree.nodeName === "a") {
        if (indexTree.attrs[0].name.startsWith("href")) {
            return indexTree.attrs[0].value;
        }
        if (indexTree.attrs[0].name.startsWith("title")) {
            return indexTree.childNodes[0].value;
        }
    }
}
function parseRooms(id, campusTree, buildingsWeNeed, object1) {
    return 0;
}
function parseData(courses, fetchData, id, objList) {
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
exports.parseData = parseData;
//# sourceMappingURL=temp.js.map