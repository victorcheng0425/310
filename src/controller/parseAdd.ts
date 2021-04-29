import * as fs from "fs-extra";
import Log from "../Util";
import {InsightError} from "./IInsightFacade";
import {findRoomFurniture, findRoomsNumber, findRoomsSeats, findRoomsType} from "./parsingInRooms";

const parse5 = require("parse5");
const http = require("http");

export function parseBuildings(id: string, content: any, tree: any, zip: any): Promise<any> {
    Log.trace("parseBuildings");
    try {
        // Log.trace(tree);
        let indexTree = parse5.parse(tree);
        let table = findTable(indexTree);
        if (table === 0) {
            throw new InsightError("failed traversal");
        }
        return Promise.resolve(table);
        // return new Promise<any>(function (resolve, reject) {
        //     Log.trace("pb");
        //     resolve(loopTree(id, table, object1, zip));
        // });
        // return loopTree(id, table, object1, objList);
    } catch (e) {
        return Promise.reject(e);
    }
    // });
    // });
}

// loop until we find the table (named tbody)
function findTable(indexTree: any): any {
    if (indexTree.nodeName === "tbody" && indexTree.childNodes.length > 0) {
        for (let trs of indexTree.childNodes) {
            if (trs.nodeName === "tr") {
                return indexTree;
            }
        }
        return 0;
    }
    // not tbody
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

// objList: list of rooms
export function loopTree(id: string, node: any, object1: any, zip: any, objList: any): any {
    Log.trace("loopTree");
    let promises: Array<Promise<string>> = [];
    for (let trs of node.childNodes) {
        if (trs.nodeName === "tr" && trs.childNodes.length > 0) {
            let href = findBuildingorRoomsHREF(trs);
            let fullname = findBuildingFullName(trs);
            let buildingcode = findBuildingCode(trs);
            let address = findBuildingAddress(trs);
            if (href !== null && fullname !== null
                && buildingcode !== null && address !== null) {
                let re = /\./gi;
                let accessRooms: string = href.replace(re, "rooms");
                // Log.trace(accessRooms);
                // Log.trace("before promises");
                try {
                    promises.push(zip.files[accessRooms].async("string").then((rooms: any) => {
                        try {
                            // Log.trace("promise array");
                            let parseTable = parse5.parse(rooms);
                            let table = findTable(parseTable);
                            // Log.trace(table);
                            if (table !== 0) {
                                // Log.trace("Before looproomTree");
                                // Log.trace(loopRoomTree(id, table, object1, fullname, buildingcode, address));
                                return loopRoomTree(id, table, object1, fullname, buildingcode, address, objList);
                            }
                        } catch (e) {
                            Log.trace("Error");
                            // return Promise.reject("error");
                        }
                        // }).catch((e: any) => {
                        //     Log.trace(e);
                        // })
                        // );
                    }));
                } catch (e) {
                    Log.trace(e);
                }
            }
        }
    }
    // Log.trace("End of LoopTree");
    // Log.trace(promises);
    // return Promise.resolve(promises);
    return Promise.all(promises).then((r) => {
        // Log.trace(r);
        // Log.trace("test");
        // Log.trace(typeof r);
        // Log.trace(r.length);
        return Promise.resolve(r);
    });
}

function loopRoomTree(id: string, roomContent: any, object1: any, fullname: string,
                      buildingcode: string, address: string, objList: any): Promise<any> {
    return new Promise<any>(function (resolve, reject) {
        // Log.trace("loopRoomTree");
        let encodedAddress = address.replace(/ /gi, "%20");
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team069/" + encodedAddress;
        let objList1: any = [];
        http.get(url, (res: any) => {
            // Log.trace("http start");
            let resdata = "";
            res.on("data", (data: string) => (resdata += data));
            res.on("end", () => {
                try {
                    let locationValue = JSON.parse(resdata);
                    // Log.trace(locationValue["error"]);
                    if (locationValue["error"] === undefined) {
                        parseRoomsAndAdd(roomContent, buildingcode,
                            id, fullname, address, locationValue, objList1, objList);
                        return resolve(objList1);
                    }
                } catch (e) {
                    Log.trace(e); // got error from uri
                    // throw (e);
                }
            });
        });
    });
}

function parseRoomsAndAdd(roomContent: any, buildingcode: string, id: string, fullname: string, address: string,
                          locationValue: any, objList1: any, objList: any) {
    for (let trs of roomContent.childNodes) {
        if (trs.nodeName === "tr" && trs.childNodes.length > 0) {
            let object2: any = {};
            let furniture = findRoomFurniture(trs);
            let numSeats = findRoomsSeats(trs);
            if (numSeats === "") {
                numSeats = "0";
            }
            let roomNumber = findRoomsNumber(trs);
            // Log.trace(roomNumber);
            let roomType = findRoomsType(trs);
            let roomsHREF = findBuildingorRoomsHREF(trs);
            let roomName = buildingcode + "_" + roomNumber;
            // Log.trace(furniture);
            // Log.trace(numSeats);
            // Log.trace(roomNumber);
            // Log.trace(roomType);
            // Log.trace(roomsHREF);
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
                // Log.trace(numRows);
                // Log.trace(objList1);
            }
        }
    }
}

function findBuildingCode(indexTree: any): string {
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

function findBuildingFullName(indexTree: any): string {
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

// access into building using building HREF and collect data from rooms HREF
function findBuildingorRoomsHREF(indexTree: any): string {
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

function findBuildingAddress(indexTree: any): string {
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

export function parseCoursesAndAdd(courses: string[], fetchData: any, id: string, objList: any): any {
    // console.log(objList);
    let numRows = 0;
    for (let course of courses) {
        try {
            fetchData = JSON.parse(course);
            if (fetchData.hasOwnProperty("result") && fetchData.result) {
                // return Promise.reject("no result key");
                // if (!fetchData.result) {
                //    return Promise.reject("empty result");
                // }
                // console.log(fetchData.result);
                for (let section of fetchData.result) {
                    let object1: any = {};
                    if (section.hasOwnProperty("Title") && section.hasOwnProperty("id")
                        && section.hasOwnProperty("Professor")
                        && section.hasOwnProperty("Audit") && section.hasOwnProperty("Year")
                        && section.hasOwnProperty("Course") && section.hasOwnProperty("Pass")
                        && section.hasOwnProperty("Fail")
                        && section.hasOwnProperty("Avg")
                        && section.hasOwnProperty("Subject")) {
                        // console.log("check");
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
                        // console.log(object1);
                        objList.push(object1);
                        // console.log(objList);
                    }
                }
            }
        } catch (e) {
            Log.trace(e);
        }
    }
    return numRows;
}
