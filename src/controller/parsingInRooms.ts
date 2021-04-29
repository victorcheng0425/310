import Log from "../Util";

export function findRoomFurniture(roomNode: any): string {
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

export function findRoomsSeats(roomNode: any): any {
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

export function findRoomsNumber(roomNode: any): string {
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

export function findRoomsType(roomNode: any): string {
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
