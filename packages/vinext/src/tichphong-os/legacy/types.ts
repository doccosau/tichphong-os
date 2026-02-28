// TichPhong OS Legacy Types Mock
export interface Song {
    id: string;
    title: string;
    url: string;
    duration: number;
}

export interface Playlist {
    id: string;
    name: string;
    songs: Song[];
}

export interface Quest {
    id: string;
    title: string;
    description: string;
}
