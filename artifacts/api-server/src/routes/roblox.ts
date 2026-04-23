import { Router, type IRouter, type Request, type Response } from "express";
import {
  LookupUserQueryParams,
  LookupUserResponse,
  GetUserProfileParams,
  GetUserProfileResponse,
  GetUserFriendsParams,
  GetUserFriendsResponse,
  GetUserGamesParams,
  GetUserGamesResponse,
  GetUserBadgesParams,
  GetUserBadgesResponse,
  GetUserGroupsParams,
  GetUserGroupsResponse,
  SearchUsersQueryParams,
  SearchUsersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const UA =
  "Mozilla/5.0 (compatible; RobloxLookup/1.0; +https://replit.com)";

async function rfetch<T = unknown>(
  url: string,
  init: RequestInit = {},
): Promise<T | null> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function thumbBatch(
  endpoint: string,
  ids: number[],
  size: string,
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.length === 0) return map;
  const url = `https://thumbnails.roblox.com/v1/${endpoint}?userIds=${ids.join(
    ",",
  )}&size=${size}&format=Png&isCircular=false`;
  const data = await rfetch<{
    data: Array<{ targetId: number; imageUrl: string; state: string }>;
  }>(url);
  if (!data?.data) return map;
  for (const d of data.data) {
    map.set(d.targetId, d.state === "Completed" ? d.imageUrl : "");
  }
  return map;
}

async function gameThumbs(
  universeIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (universeIds.length === 0) return map;
  const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(
    ",",
  )}&size=256x256&format=Png&isCircular=false`;
  const data = await rfetch<{
    data: Array<{ targetId: number; imageUrl: string; state: string }>;
  }>(url);
  if (!data?.data) return map;
  for (const d of data.data) {
    map.set(d.targetId, d.state === "Completed" ? d.imageUrl : "");
  }
  return map;
}

async function groupEmblems(
  groupIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (groupIds.length === 0) return map;
  const url = `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupIds.join(
    ",",
  )}&size=150x150&format=Png&isCircular=false`;
  const data = await rfetch<{
    data: Array<{ targetId: number; imageUrl: string; state: string }>;
  }>(url);
  if (!data?.data) return map;
  for (const d of data.data) {
    map.set(d.targetId, d.state === "Completed" ? d.imageUrl : "");
  }
  return map;
}

router.get("/roblox/lookup", async (req: Request, res: Response) => {
  const parsed = LookupUserQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "username is required" });
    return;
  }
  const { username } = parsed.data;
  const data = await rfetch<{
    data: Array<{ id: number; name: string; displayName: string }>;
  }>("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false,
    }),
  });
  const user = data?.data?.[0];
  if (!user) {
    res.status(404).json({ message: `User "${username}" not found` });
    return;
  }
  res.json(
    LookupUserResponse.parse({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
    }),
  );
});

router.get("/roblox/users/:userId", async (req: Request, res: Response) => {
  const parsed = GetUserProfileParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid userId" });
    return;
  }
  const { userId } = parsed.data;

  const [
    profile,
    friendsCount,
    followersCount,
    followingCount,
    presenceData,
    robloxBadgesData,
    headshotMap,
    fullMap,
    usernameHistory,
  ] = await Promise.all([
    rfetch<{
      id: number;
      name: string;
      displayName: string;
      description: string;
      created: string;
      isBanned: boolean;
      hasVerifiedBadge: boolean;
      externalAppDisplayName: string | null;
    }>(`https://users.roblox.com/v1/users/${userId}`),
    rfetch<{ count: number }>(
      `https://friends.roblox.com/v1/users/${userId}/friends/count`,
    ),
    rfetch<{ count: number }>(
      `https://friends.roblox.com/v1/users/${userId}/followers/count`,
    ),
    rfetch<{ count: number }>(
      `https://friends.roblox.com/v1/users/${userId}/followings/count`,
    ),
    rfetch<{
      userPresences: Array<{
        userPresenceType: number;
        lastLocation: string | null;
        lastOnline: string | null;
        placeId: number | null;
        gameId: string | null;
      }>;
    }>("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    }),
    rfetch<
      Array<{
        id: number;
        name: string;
        description: string;
        imageUrl: string;
      }>
    >(
      `https://accountinformation.roblox.com/v1/users/${userId}/roblox-badges`,
    ),
    thumbBatch("users/avatar-headshot", [userId], "420x420"),
    thumbBatch("users/avatar", [userId], "720x720"),
    rfetch<{ data: Array<{ name: string }> }>(
      `https://users.roblox.com/v1/users/${userId}/username-history?limit=10&sortOrder=Desc`,
    ),
  ]);

  if (!profile) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const presence = presenceData?.userPresences?.[0] ?? {
    userPresenceType: 0,
    lastLocation: null,
    lastOnline: null,
    placeId: null,
    gameId: null,
  };

  const data = {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description ?? "",
    created: profile.created,
    isBanned: profile.isBanned,
    externalAppDisplayName: profile.externalAppDisplayName,
    hasVerifiedBadge: profile.hasVerifiedBadge,
    avatarHeadshotUrl: headshotMap.get(userId) ?? "",
    avatarFullUrl: fullMap.get(userId) ?? "",
    friendsCount: friendsCount?.count ?? 0,
    followersCount: followersCount?.count ?? 0,
    followingCount: followingCount?.count ?? 0,
    presence,
    robloxBadges: (robloxBadgesData ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
    })),
    previousUsernames: (usernameHistory?.data ?? []).map((u) => u.name),
  };

  res.json(GetUserProfileResponse.parse(data));
});

router.get(
  "/roblox/users/:userId/friends",
  async (req: Request, res: Response) => {
    const parsed = GetUserFriendsParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }
    const { userId } = parsed.data;

    const data = await rfetch<{
      data: Array<{
        id: number;
        name: string;
        displayName: string;
        hasVerifiedBadge: boolean;
      }>;
    }>(`https://friends.roblox.com/v1/users/${userId}/friends`);

    const friends = (data?.data ?? []).slice(0, 24);
    const ids = friends.map((f) => f.id);
    const thumbs = await thumbBatch("users/avatar-headshot", ids, "150x150");

    const out = {
      total: friends.length,
      friends: friends.map((f) => ({
        id: f.id,
        name: f.name,
        displayName: f.displayName,
        hasVerifiedBadge: f.hasVerifiedBadge,
        avatarHeadshotUrl: thumbs.get(f.id) ?? "",
      })),
    };
    res.json(GetUserFriendsResponse.parse(out));
  },
);

router.get(
  "/roblox/users/:userId/games",
  async (req: Request, res: Response) => {
    const parsed = GetUserGamesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }
    const { userId } = parsed.data;

    const data = await rfetch<{
      data: Array<{
        id: number;
        name: string;
        description: string | null;
        placeVisits: number;
        rootPlace?: { id: number; type: string };
      }>;
    }>(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&sortOrder=Asc&limit=25`,
    );

    const games = (data?.data ?? []).slice(0, 12);
    const universeIds = games.map((g) => g.id);
    const thumbs = await gameThumbs(universeIds);

    const out = {
      games: games.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        placeVisits: g.placeVisits,
        thumbnailUrl: thumbs.get(g.id) ?? null,
      })),
    };
    res.json(GetUserGamesResponse.parse(out));
  },
);

router.get(
  "/roblox/users/:userId/badges",
  async (req: Request, res: Response) => {
    const parsed = GetUserBadgesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }
    const { userId } = parsed.data;

    const data = await rfetch<{
      data: Array<{
        id: number;
        name: string;
        description: string | null;
        displayIconImageId: number | null;
      }>;
    }>(
      `https://badges.roblox.com/v1/users/${userId}/badges?limit=25&sortOrder=Desc`,
    );

    const badges = (data?.data ?? []).slice(0, 24);
    const iconIds = badges
      .map((b) => b.displayIconImageId)
      .filter((id): id is number => id !== null);

    const iconMap = new Map<number, string>();
    if (iconIds.length > 0) {
      const iconData = await rfetch<{
        data: Array<{ targetId: number; imageUrl: string; state: string }>;
      }>(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${iconIds.join(
          ",",
        )}&size=150x150&format=Png&isCircular=false`,
      );
      if (iconData?.data) {
        for (const d of iconData.data) {
          iconMap.set(
            d.targetId,
            d.state === "Completed" ? d.imageUrl : "",
          );
        }
      }
    }

    const out = {
      badges: badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        iconImageUrl: b.displayIconImageId
          ? iconMap.get(b.displayIconImageId) ?? null
          : null,
        awardedDate: null,
      })),
    };
    res.json(GetUserBadgesResponse.parse(out));
  },
);

router.get(
  "/roblox/users/:userId/groups",
  async (req: Request, res: Response) => {
    const parsed = GetUserGroupsParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }
    const { userId } = parsed.data;

    const data = await rfetch<{
      data: Array<{
        group: { id: number; name: string; memberCount: number };
        role: { name: string };
      }>;
    }>(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);

    const groups = (data?.data ?? []).slice(0, 24);
    const groupIds = groups.map((g) => g.group.id);
    const emblems = await groupEmblems(groupIds);

    const out = {
      groups: groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
        memberCount: g.group.memberCount,
        role: g.role.name,
        emblemUrl: emblems.get(g.group.id) ?? null,
      })),
    };
    res.json(GetUserGroupsResponse.parse(out));
  },
);

router.get("/roblox/search", async (req: Request, res: Response) => {
  const parsed = SearchUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "keyword is required" });
    return;
  }
  const { keyword } = parsed.data;

  const data = await rfetch<{
    data: Array<{
      id: number;
      name: string;
      displayName: string;
      hasVerifiedBadge: boolean;
    }>;
  }>(
    `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(
      keyword,
    )}&limit=10`,
  );

  const results = (data?.data ?? []).slice(0, 8);
  const ids = results.map((r) => r.id);
  const thumbs = await thumbBatch("users/avatar-headshot", ids, "150x150");

  const out = {
    results: results.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      hasVerifiedBadge: r.hasVerifiedBadge,
      avatarHeadshotUrl: thumbs.get(r.id) ?? "",
    })),
  };
  res.json(SearchUsersResponse.parse(out));
});

export default router;
