"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findRoomFurniture(roomNode) {
    if (roomNode.nodeName === "td" &&
        roomNode.attrs[0].value.startsWith("views-field views-field-field-room-furniture")) {
        return roomNode.childNodes[0].value.trim();
    }
    if (roomNode.childNodes && roomNode.childNodes.length > 0) {
        for (let child of roomNode.childNodes) {
            let roomFurniture = findRoomFurniture(child);
            if (roomFurniture !== null) {
                return roomFurniture;
            }
        }
    }
    return null;
}
exports.findRoomFurniture = findRoomFurniture;
function findRoomsSeats(roomNode) {
    if (roomNode.nodeName === "td" &&
        roomNode.attrs[0].value.startsWith("views-field views-field-field-room-capacity")) {
        return roomNode.childNodes[0].value.trim();
    }
    if (roomNode.childNodes && roomNode.childNodes.length > 0) {
        for (let child of roomNode.childNodes) {
            let roomSeats = findRoomsSeats(child);
            if (roomSeats !== -1) {
                return roomSeats;
            }
        }
    }
    return -1;
}
exports.findRoomsSeats = findRoomsSeats;
function findRoomsNumber(roomNode) {
    if (roomNode.nodeName === "a"
        && roomNode.attrs[1].value.startsWith("Room Details")) {
        return roomNode.childNodes[0].value.trim();
    }
    if (roomNode.childNodes && roomNode.childNodes.length > 0) {
        for (let child of roomNode.childNodes) {
            let roomNumber = findRoomsNumber(child);
            if (roomNumber !== null) {
                return roomNumber;
            }
        }
    }
    return null;
}
exports.findRoomsNumber = findRoomsNumber;
function findRoomsType(roomNode) {
    if (roomNode.nodeName === "td" &&
        roomNode.attrs[0].value.startsWith("views-field views-field-field-room-type")) {
        return roomNode.childNodes[0].value.trim();
    }
    if (roomNode.childNodes && roomNode.childNodes.length > 0) {
        for (let child of roomNode.childNodes) {
            let roomType = findRoomsType(child);
            if (roomType !== null) {
                return roomType;
            }
        }
    }
    return null;
}
exports.findRoomsType = findRoomsType;
//# sourceMappingURL=parsingInRooms.js.map