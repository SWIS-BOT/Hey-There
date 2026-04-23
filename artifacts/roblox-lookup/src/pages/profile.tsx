import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { 
  useGetUserProfile, 
  getGetUserProfileQueryKey,
  useGetUserFriends,
  getGetUserFriendsQueryKey,
  useGetUserGames,
  getGetUserGamesQueryKey,
  useGetUserGroups,
  getGetUserGroupsQueryKey,
  useGetUserBadges,
  getGetUserBadgesQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, Link as LinkIcon, ExternalLink, Calendar, 
  Users, Gamepad2, Shield, User, Clock, MapPin
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function Profile() {
  const [, params] = useRoute("/user/:userId");
  const userId = params?.userId ? parseInt(params.userId, 10) : 0;
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetUserProfile(
    userId,
    { query: { enabled: !!userId, queryKey: getGetUserProfileQueryKey(userId) } }
  );

  useEffect(() => {
    if (profile) {
      document.title = `${profile.displayName} (@${profile.name}) - Roblox Lookup`;
    }
  }, [profile]);

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium text-muted-foreground animate-pulse">Loading profile...</h2>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Failed to load profile</h2>
        <p className="text-muted-foreground">The user might be banned, private, or doesn't exist.</p>
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Profile link has been copied to your clipboard.",
    });
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    return new Intl.NumberFormat().format(num);
  };

  const getPresenceInfo = (type: number) => {
    switch (type) {
      case 1: return { label: "Online", color: "bg-green-500", text: "text-green-500" };
      case 2: return { label: "In-game", color: "bg-blue-500", text: "text-blue-500" };
      case 3: return { label: "In Studio", color: "bg-orange-500", text: "text-orange-500" };
      case 4: return { label: "Invisible", color: "bg-gray-400", text: "text-gray-400" };
      case 0:
      default: return { label: "Offline", color: "bg-gray-400", text: "text-gray-400" };
    }
  };

  const presence = getPresenceInfo(profile.presence.userPresenceType);
  const createdDate = new Date(profile.created);

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header Card */}
      <motion.div variants={item} className="bg-card rounded-[2rem] shadow-sm border overflow-hidden mb-8 relative">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent w-full absolute top-0 left-0" />
        
        <div className="relative p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="relative shrink-0">
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-muted rounded-full p-2 border-4 border-card shadow-sm overflow-hidden flex items-center justify-center">
              {profile.avatarFullUrl ? (
                <img src={profile.avatarFullUrl} alt={profile.displayName} className="w-full h-full object-cover object-top" />
              ) : (
                <User className="w-20 h-20 text-muted-foreground/30" />
              )}
            </div>
            <div className={`absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-card ${presence.color}`} title={presence.label} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black truncate text-foreground tracking-tight">
                {profile.displayName}
              </h1>
              {profile.hasVerifiedBadge && (
                <Shield className="w-6 h-6 text-blue-500 fill-blue-500/20" />
              )}
              {profile.isBanned && (
                <Badge variant="destructive" className="uppercase font-bold tracking-wider">Banned</Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground font-medium mb-4">
              @{profile.name}
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${presence.color}`} />
                <span className="font-medium text-foreground">{presence.label}</span>
                {profile.presence.lastLocation && <span className="text-muted-foreground">— {profile.presence.lastLocation}</span>}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDistanceToNow(createdDate)} ago · {format(createdDate, 'MMM yyyy')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={copyLink} variant="outline" className="rounded-xl" data-testid="button-copy-link">
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <a href={`https://www.roblox.com/users/${profile.id}/profile`} target="_blank" rel="noreferrer">
                <Button className="rounded-xl" data-testid="button-open-roblox">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open on Roblox
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 border-t p-6 sm:px-10 flex flex-wrap gap-8">
          <div>
            <div className="text-2xl font-black text-foreground">{formatNumber(profile.friendsCount)}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Friends</div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{formatNumber(profile.followersCount)}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{formatNumber(profile.followingCount)}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Following</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={item} className="md:col-span-1 space-y-8">
          <Card className="rounded-[1.5rem] border shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">About</h3>
              <div className="text-sm text-foreground/80 whitespace-pre-wrap font-medium leading-relaxed">
                {profile.description || <span className="text-muted-foreground italic">No description provided.</span>}
              </div>
            </CardContent>
          </Card>

          {profile.previousUsernames && profile.previousUsernames.length > 0 && (
            <Card className="rounded-[1.5rem] border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Past Usernames</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.previousUsernames.map((uname, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">{uname}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.robloxBadges && profile.robloxBadges.length > 0 && (
            <Card className="rounded-[1.5rem] border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Roblox Badges</h3>
                <div className="grid grid-cols-3 gap-4">
                  {profile.robloxBadges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center gap-2" title={badge.description}>
                      <img src={badge.imageUrl} alt={badge.name} className="w-12 h-12 object-contain" />
                      <span className="text-[10px] font-semibold leading-tight line-clamp-2">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-2xl mb-6">
              <TabsTrigger value="friends" className="rounded-xl px-6 py-2.5 text-sm font-semibold">Friends</TabsTrigger>
              <TabsTrigger value="games" className="rounded-xl px-6 py-2.5 text-sm font-semibold">Games</TabsTrigger>
              <TabsTrigger value="groups" className="rounded-xl px-6 py-2.5 text-sm font-semibold">Groups</TabsTrigger>
              <TabsTrigger value="badges" className="rounded-xl px-6 py-2.5 text-sm font-semibold">Badges</TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends" className="outline-none">
              <FriendsTab userId={userId} />
            </TabsContent>
            <TabsContent value="games" className="outline-none">
              <GamesTab userId={userId} />
            </TabsContent>
            <TabsContent value="groups" className="outline-none">
              <GroupsTab userId={userId} />
            </TabsContent>
            <TabsContent value="badges" className="outline-none">
              <BadgesTab userId={userId} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FriendsTab({ userId }: { userId: number }) {
  const { data, isLoading, isError } = useGetUserFriends(
    userId,
    { query: { enabled: !!userId, queryKey: getGetUserFriendsQueryKey(userId) } }
  );

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError />;
  if (!data?.friends?.length) return <TabEmpty icon={<Users className="w-12 h-12" />} message="No friends found." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.friends.map((friend) => (
        <a key={friend.id} href={`/user/${friend.id}`} className="block">
          <Card className="rounded-[1rem] border shadow-sm hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-12 h-12 border border-border/50">
                {friend.avatarHeadshotUrl ? (
                  <AvatarImage src={friend.avatarHeadshotUrl} />
                ) : (
                  <AvatarFallback>{friend.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1">
                  {friend.displayName}
                  {friend.hasVerifiedBadge && <Shield className="w-3 h-3 text-blue-500 fill-blue-500/20" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">@{friend.name}</div>
              </div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}

function GamesTab({ userId }: { userId: number }) {
  const { data, isLoading, isError } = useGetUserGames(
    userId,
    { query: { enabled: !!userId, queryKey: getGetUserGamesQueryKey(userId) } }
  );

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError />;
  if (!data?.games?.length) return <TabEmpty icon={<Gamepad2 className="w-12 h-12" />} message="No public games found." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.games.map((game) => (
        <Card key={game.id} className="rounded-[1rem] border shadow-sm overflow-hidden h-full">
          <div className="h-32 bg-muted relative border-b">
            {game.thumbnailUrl ? (
              <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <Gamepad2 className="w-10 h-10" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="font-bold text-lg line-clamp-1 mb-1" title={game.name}>{game.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <Users className="w-4 h-4" /> {new Intl.NumberFormat().format(game.placeVisits)} visits
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {game.description || "No description"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GroupsTab({ userId }: { userId: number }) {
  const { data, isLoading, isError } = useGetUserGroups(
    userId,
    { query: { enabled: !!userId, queryKey: getGetUserGroupsQueryKey(userId) } }
  );

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError />;
  if (!data?.groups?.length) return <TabEmpty icon={<Shield className="w-12 h-12" />} message="Not a member of any public groups." />;

  return (
    <div className="flex flex-col gap-3">
      {data.groups.map((group) => (
        <Card key={group.id} className="rounded-[1rem] border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted border overflow-hidden shrink-0">
              {group.emblemUrl ? (
                <img src={group.emblemUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-full h-full p-3 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate text-base">{group.name}</div>
              <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                <span className="font-semibold text-primary">{group.role}</span>
                <span className="text-muted-foreground">{new Intl.NumberFormat().format(group.memberCount)} members</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BadgesTab({ userId }: { userId: number }) {
  const { data, isLoading, isError } = useGetUserBadges(
    userId,
    { query: { enabled: !!userId, queryKey: getGetUserBadgesQueryKey(userId) } }
  );

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError />;
  if (!data?.badges?.length) return <TabEmpty icon={<MapPin className="w-12 h-12" />} message="No badges earned yet." />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {data.badges.map((badge) => (
        <Card key={badge.id} className="rounded-[1rem] border shadow-sm flex flex-col h-full">
          <CardContent className="p-4 flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-muted border overflow-hidden mb-3">
              {badge.iconImageUrl ? (
                <img src={badge.iconImageUrl} alt={badge.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Badge className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="font-bold text-sm line-clamp-2 mb-1 leading-tight">{badge.name}</div>
            {badge.awardedDate && (
              <div className="text-[10px] text-muted-foreground mt-auto pt-2 uppercase font-semibold">
                {format(new Date(badge.awardedDate), 'MMM d, yyyy')}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabLoading() {
  return (
    <div className="py-20 flex justify-center text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

function TabError() {
  return (
    <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-[1rem] border-border/50">
      <p>Failed to load data. Please try again.</p>
    </div>
  );
}

function TabEmpty({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-[1rem] border-border/50 flex flex-col items-center justify-center gap-4">
      <div className="text-muted-foreground/30">{icon}</div>
      <p className="font-medium">{message}</p>
    </div>
  );
}
