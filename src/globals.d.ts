interface HCommandsSavedData {
    [guildID: string]: {
        prefix: string;
        whitelistChannels: string[];
        blacklistRoles: string[];
        whitelistRoles: string[];
    };
}

interface ELevelsSavedData {
    userProgress: {
        [userID: string]: {
            timeout: number;
            totalXP: number;
            guildXP: {
                [guildID: string]: number;
            };
        };
    };
    guildSettings: {
        [guildID: string]: {
            enabled: boolean;
            blacklistChannels: string[];
            blacklistRoles: string[];
        };
    };
}

interface HostPresence {
    status: "online" | "idle" | "dnd" | "invisible";
    game?: {
        name: string;
        type?: "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING";
        url?: string;
    };
}
