import { request } from "./client";

type GridCoord = [number, number];
type GridData = GridCoord[];

type ResponseMapsId = {
    "id":           number;
    "created_by":   string;
    "name":         string;
    "grid_data":    GridData;
    "cell_size":    number;
    "length":       number;
    "width":        number;
    "created_at":   string;
}

type MapItem = {
    id: number;
    name: string;
    grid_data: unknown; //JSON
    cell_size: number;
    length: number;
    width: number;
    created_by: number;
    created_at: string;
};

type MapPayload = {
    name: string;
    cell_size: number;
    length: number;
    width: number;
    grid_data?: unknown;
};

export async function request_MapsId(
    index: number
): Promise<ResponseMapsId> {
    return request<ResponseMapsId>(`/api/maps/${index}/`, {
        method: "GET"
    });
}

export async function request_MapListCreate(
    payload: MapPayload
): Promise<MapPayload> {
    return request<MapPayload>("/api/maps/", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function request_Maps(): Promise<MapItem[]> {
    return request<MapItem[]>(`/api/maps/`, {
        method: "GET"
    });
}

/*
PUT /api/maps/2/ HTTP/1.1
Host: 209.38.89.2:8000
Content-Length: 1835
X-CSRFTOKEN: 2nUDqMWkW9UptRWO7n8z5S9eTRl6qyUrRp1eRXLrxFBbW8i8E4BWzBE8cZD2yHRz
X-Requested-With: XMLHttpRequest
Accept-Language: en-US,en;q=0.9
Accept: text/html; q=1.0, *`/*`
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryq5airgzTxED3rcAL
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36
Origin: http://209.38.89.2:8000
Referer: http://209.38.89.2:8000/api/maps/2/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

------WebKitFormBoundaryq5airgzTxED3rcAL
Content-Disposition: form-data; name="name"

test_grid_data_map
------WebKitFormBoundaryq5airgzTxED3rcAL
Content-Disposition: form-data; name="grid_data"

[
    [
        0,
        0
    ],
    ...
]

------WebKitFormBoundaryq5airgzTxED3rcAL
Content-Disposition: form-data; name="cell_size"

28.0
------WebKitFormBoundaryq5airgzTxED3rcAL
Content-Disposition: form-data; name="length"

9.0
------WebKitFormBoundaryq5airgzTxED3rcAL
Content-Disposition: form-data; name="width"

9.0
------WebKitFormBoundaryq5airgzTxED3rcAL--


*/

export async function request_UpdateMap(id: number, payload: Partial<MapPayload>): Promise<MapPayload> {
    return await request<MapItem>(`/api/maps/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

/*

DELETE /api/maps/2/ HTTP/1.1
Host: 209.38.89.2:8000
X-CSRFTOKEN: hqs6LhsJOkmVF0jDjDC172HsYQB9eDyrdA7980GYmHnJYCN8QAaFGd80XivCa9MM
X-Requested-With: XMLHttpRequest
Accept-Language: en-US,en;q=0.9
Accept: text/html; q=1.0, *`/*`
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36
Origin: http://209.38.89.2:8000
Referer: http://209.38.89.2:8000/api/maps/2/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive


*/

export async function request_DeleteMap(id: number): Promise<void> {
    return await request<void>(`/api/maps/${id}/`,{method: "DELETE",});
}