export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type GraphQL_Contributor = {
  __typename?: 'Contributor';
  _id?: Maybe<Scalars['ID']>;
  stamp?: Maybe<Scalars['String']>;
  user?: Maybe<GraphQL_User>;
};

export type GraphQL_CreatePostOutput = GraphQL_MutationOutput & {
  __typename?: 'CreatePostOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  post?: Maybe<GraphQL_PostDetailed>;
  success: Scalars['Boolean'];
};

export type GraphQL_CreateStoryInput = {
  contentMarkdown: Scalars['String'];
  coverImageURL?: InputMaybe<Scalars['String']>;
  isAnonymous?: InputMaybe<Scalars['Boolean']>;
  isRepublished?: InputMaybe<GraphQL_IsRepublished>;
  publishAs?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  sourcedFromGithub?: InputMaybe<Scalars['Boolean']>;
  subtitle?: InputMaybe<Scalars['String']>;
  tags: Array<InputMaybe<GraphQL_TagsInput>>;
  title: Scalars['String'];
};

export type GraphQL_DeleteOutput = GraphQL_MutationOutput & {
  __typename?: 'DeleteOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export enum GraphQL_FeedType {
  Best = 'BEST',
  Community = 'COMMUNITY',
  Featured = 'FEATURED',
  New = 'NEW'
}

export type GraphQL_FollowUserOutput = GraphQL_MutationOutput & {
  __typename?: 'FollowUserOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GraphQL_Links = {
  __typename?: 'Links';
  github?: Maybe<Scalars['String']>;
  hashnode?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

export type GraphQL_Mutation = {
  __typename?: 'Mutation';
  createPublicationStory: GraphQL_CreatePostOutput;
  createReply: GraphQL_CreateReplyOutput;
  createResponse: GraphQL_CreateResponseOutput;
  createStory: GraphQL_CreatePostOutput;
  deletePost: GraphQL_DeleteOutput;
  deleteReply: GraphQL_DeleteOutput;
  deleteResponse: GraphQL_DeleteOutput;
  followUser: GraphQL_FollowUserOutput;
  reactToReply: GraphQL_ReactToReplyOutput;
  reactToResponse: GraphQL_ReactToResponseOutput;
  reactToStory: GraphQL_ReactToPostOutput;
  updateReply: GraphQL_CreateReplyOutput;
  updateResponse: GraphQL_CreateResponseOutput;
  updateStory: GraphQL_CreatePostOutput;
};


export type GraphQL_MutationCreatePublicationStoryArgs = {
  hideFromHashnodeFeed?: InputMaybe<Scalars['Boolean']>;
  input: GraphQL_CreateStoryInput;
  publicationId: Scalars['String'];
};


export type GraphQL_MutationCreateReplyArgs = {
  input: GraphQL_CreateReplyInput;
};


export type GraphQL_MutationCreateResponseArgs = {
  input: GraphQL_CreateResponseInput;
};


export type GraphQL_MutationCreateStoryArgs = {
  input: GraphQL_CreateStoryInput;
};


export type GraphQL_MutationDeletePostArgs = {
  id: Scalars['String'];
};


export type GraphQL_MutationDeleteReplyArgs = {
  postId: Scalars['String'];
  replyId: Scalars['String'];
  responseId: Scalars['String'];
};


export type GraphQL_MutationDeleteResponseArgs = {
  postId: Scalars['String'];
  responseId: Scalars['String'];
};


export type GraphQL_MutationFollowUserArgs = {
  userId: Scalars['String'];
};


export type GraphQL_MutationReactToReplyArgs = {
  input: GraphQL_ReactToReplyInput;
};


export type GraphQL_MutationReactToResponseArgs = {
  input: GraphQL_ReactToResponseInput;
};


export type GraphQL_MutationReactToStoryArgs = {
  input: GraphQL_ReactToPostInput;
};


export type GraphQL_MutationUpdateReplyArgs = {
  contentInMarkdown: Scalars['String'];
  postId: Scalars['String'];
  replyId: Scalars['String'];
  responseId: Scalars['String'];
};


export type GraphQL_MutationUpdateResponseArgs = {
  contentInMarkdown: Scalars['String'];
  postId?: InputMaybe<Scalars['String']>;
  responseId: Scalars['String'];
};


export type GraphQL_MutationUpdateStoryArgs = {
  input: GraphQL_UpdateStoryInput;
  postId: Scalars['String'];
};

export type GraphQL_MutationOutput = {
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GraphQL_Poll = {
  __typename?: 'Poll';
  pollClosingDate?: Maybe<Scalars['String']>;
  pollOptions?: Maybe<Array<Maybe<GraphQL_PollOption>>>;
  pollRunningTime?: Maybe<Scalars['String']>;
  totalVotes?: Maybe<Scalars['Int']>;
};

export type GraphQL_PollOption = {
  __typename?: 'PollOption';
  _id: Scalars['ID'];
  option: Scalars['String'];
  votes: Scalars['Int'];
};

export type GraphQL_PollOptionInput = {
  content: Scalars['String'];
};

export type GraphQL_Post = {
  __typename?: 'Post';
  _id: Scalars['ID'];
  author?: Maybe<GraphQL_User>;
  bookmarkedIn?: Maybe<Array<Maybe<Scalars['String']>>>;
  brief?: Maybe<Scalars['String']>;
  contentMarkdown?: Maybe<Scalars['String']>;
  contributors?: Maybe<Array<Maybe<GraphQL_Contributor>>>;
  coverImage: Scalars['String'];
  cuid?: Maybe<Scalars['String']>;
  dateAdded?: Maybe<Scalars['String']>;
  dateFeatured?: Maybe<Scalars['String']>;
  dateUpdated?: Maybe<Scalars['String']>;
  followersCount?: Maybe<Scalars['Int']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAnonymous?: Maybe<Scalars['Boolean']>;
  numUniqueUsersWhoReacted?: Maybe<Scalars['Int']>;
  partOfPublication?: Maybe<Scalars['Boolean']>;
  poll?: Maybe<GraphQL_Poll>;
  popularity?: Maybe<Scalars['Float']>;
  reactions?: Maybe<Array<Maybe<GraphQL_Reaction>>>;
  reactionsByCurrentUser?: Maybe<Array<Maybe<GraphQL_Reaction>>>;
  replyCount?: Maybe<Scalars['Int']>;
  responseCount?: Maybe<Scalars['Int']>;
  slug?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<GraphQL_Tag>>>;
  title?: Maybe<Scalars['String']>;
  totalReactions?: Maybe<Scalars['Int']>;
  type: Scalars['String'];
};

export type GraphQL_PostDetailed = {
  __typename?: 'PostDetailed';
  _id: Scalars['ID'];
  author?: Maybe<GraphQL_User>;
  bookmarkedIn?: Maybe<Array<Maybe<Scalars['String']>>>;
  brief?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  contentMarkdown?: Maybe<Scalars['String']>;
  contributors?: Maybe<Array<Maybe<GraphQL_Contributor>>>;
  coverImage?: Maybe<Scalars['String']>;
  cuid?: Maybe<Scalars['String']>;
  dateAdded?: Maybe<Scalars['String']>;
  dateUpdated?: Maybe<Scalars['String']>;
  followersCount?: Maybe<Scalars['Int']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAnonymous?: Maybe<Scalars['Boolean']>;
  isDelisted?: Maybe<Scalars['Boolean']>;
  isFeatured?: Maybe<Scalars['Boolean']>;
  isRepublished?: Maybe<Scalars['Boolean']>;
  numCollapsed?: Maybe<Scalars['Int']>;
  partOfPublication?: Maybe<Scalars['Boolean']>;
  poll?: Maybe<GraphQL_Poll>;
  popularity?: Maybe<Scalars['Float']>;
  publication?: Maybe<GraphQL_Publication>;
  reactions?: Maybe<Array<Maybe<GraphQL_ReactionsAndCount>>>;
  reactionsByCurrentUser?: Maybe<Array<Maybe<GraphQL_Reaction>>>;
  replyCount?: Maybe<Scalars['Int']>;
  responseCount?: Maybe<Scalars['Int']>;
  responses: Array<GraphQL_Response>;
  slug?: Maybe<Scalars['String']>;
  sourcedFromGithub?: Maybe<Scalars['Boolean']>;
  tags?: Maybe<Array<Maybe<GraphQL_Tag>>>;
  title?: Maybe<Scalars['String']>;
  totalReactions?: Maybe<Scalars['Int']>;
  type?: Maybe<Scalars['String']>;
  untaggedFrom?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type GraphQL_PostDetailedResponsesArgs = {
  page?: InputMaybe<Scalars['Int']>;
};

export type GraphQL_Publication = {
  __typename?: 'Publication';
  _id: Scalars['ID'];
  author?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  displayTitle?: Maybe<Scalars['String']>;
  domain?: Maybe<Scalars['String']>;
  embedCode?: Maybe<Scalars['String']>;
  favicon?: Maybe<Scalars['String']>;
  fbPixelID?: Maybe<Scalars['String']>;
  gaTrackingID?: Maybe<Scalars['String']>;
  headerColor?: Maybe<Scalars['String']>;
  imprint?: Maybe<Scalars['String']>;
  imprintMarkdown?: Maybe<Scalars['String']>;
  isAMPEnabled?: Maybe<Scalars['Boolean']>;
  isActive?: Maybe<Scalars['Boolean']>;
  layout?: Maybe<Scalars['String']>;
  links?: Maybe<GraphQL_Links>;
  logo?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['String']>;
  metaHTML?: Maybe<Scalars['String']>;
  metaTags?: Maybe<Scalars['String']>;
  ogImage?: Maybe<Scalars['String']>;
  posts?: Maybe<Array<Maybe<GraphQL_Post>>>;
  sitemapSubmitted?: Maybe<Scalars['Boolean']>;
  title?: Maybe<Scalars['String']>;
  tweetedAboutBlog?: Maybe<Scalars['Boolean']>;
  username?: Maybe<Scalars['String']>;
};


export type GraphQL_PublicationPostsArgs = {
  page?: InputMaybe<Scalars['Int']>;
};

export type GraphQL_PublicationDetails = {
  publicationId: Scalars['String'];
};

export type GraphQL_Query = {
  __typename?: 'Query';
  amas?: Maybe<Array<Maybe<GraphQL_Post>>>;
  post?: Maybe<GraphQL_PostDetailed>;
  storiesFeed?: Maybe<Array<Maybe<GraphQL_Post>>>;
  tagCategories?: Maybe<Array<Maybe<GraphQL_TagCategory>>>;
  user?: Maybe<GraphQL_User>;
};


export type GraphQL_QueryAmasArgs = {
  page?: InputMaybe<Scalars['Int']>;
};


export type GraphQL_QueryPostArgs = {
  hostname?: InputMaybe<Scalars['String']>;
  slug: Scalars['String'];
};


export type GraphQL_QueryStoriesFeedArgs = {
  page?: InputMaybe<Scalars['Int']>;
  type: GraphQL_FeedType;
};


export type GraphQL_QueryUserArgs = {
  username: Scalars['String'];
};

export type GraphQL_ReactToPostInput = {
  postId: Scalars['String'];
  reaction: GraphQL_ReactionName;
};

export type GraphQL_ReactToPostOutput = GraphQL_MutationOutput & {
  __typename?: 'ReactToPostOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GraphQL_ReactToReplyInput = {
  postId: Scalars['String'];
  reaction: GraphQL_ReactionName;
  replyId: Scalars['String'];
  responseId: Scalars['String'];
};

export type GraphQL_ReactToReplyOutput = GraphQL_MutationOutput & {
  __typename?: 'ReactToReplyOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GraphQL_ReactToResponseInput = {
  postId: Scalars['String'];
  reaction: GraphQL_ReactionName;
  responseId: Scalars['String'];
};

export type GraphQL_ReactToResponseOutput = GraphQL_MutationOutput & {
  __typename?: 'ReactToResponseOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GraphQL_Reaction = {
  __typename?: 'Reaction';
  image: Scalars['String'];
  name: GraphQL_ReactionName;
};

export enum GraphQL_ReactionName {
  Beer = 'BEER',
  Clap = 'CLAP',
  HeartEyes = 'HEART_EYES',
  Love = 'LOVE',
  Party = 'PARTY',
  Rocket = 'ROCKET',
  TakeMyMoney = 'TAKE_MY_MONEY',
  ThumbsUp = 'THUMBS_UP',
  Trophy = 'TROPHY',
  Unicorn = 'UNICORN'
}

export type GraphQL_ReactionsAndCount = {
  __typename?: 'ReactionsAndCount';
  count: Scalars['Int'];
  reaction: GraphQL_Reaction;
};

export type GraphQL_Reply = {
  __typename?: 'Reply';
  _id: Scalars['ID'];
  author: GraphQL_User;
  content: Scalars['String'];
  contentMarkdown: Scalars['String'];
  dateAdded: Scalars['String'];
  isActive?: Maybe<Scalars['Boolean']>;
  reactions?: Maybe<Array<Maybe<GraphQL_ReactionsAndCount>>>;
  reactionsByCurrentUser?: Maybe<Array<Maybe<GraphQL_Reaction>>>;
  stamp?: Maybe<Scalars['String']>;
  totalReactions?: Maybe<Scalars['Int']>;
};

export type GraphQL_Response = {
  __typename?: 'Response';
  _id: Scalars['ID'];
  author?: Maybe<GraphQL_User>;
  bookmarkedIn?: Maybe<Array<Maybe<Scalars['String']>>>;
  content?: Maybe<Scalars['String']>;
  contentMarkdown?: Maybe<Scalars['String']>;
  dateAdded?: Maybe<Scalars['String']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isCollapsed?: Maybe<Scalars['Boolean']>;
  popularity?: Maybe<Scalars['Float']>;
  post?: Maybe<Scalars['String']>;
  reactions?: Maybe<Array<Maybe<GraphQL_ReactionsAndCount>>>;
  reactionsByCurrentUser?: Maybe<Array<Maybe<GraphQL_Reaction>>>;
  replies?: Maybe<Array<Maybe<GraphQL_Reply>>>;
  stamp?: Maybe<Scalars['String']>;
  totalReactions?: Maybe<Scalars['Int']>;
};

export type GraphQL_SocialMedia = {
  __typename?: 'SocialMedia';
  facebook?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  google?: Maybe<Scalars['String']>;
  linkedin?: Maybe<Scalars['String']>;
  stackoverflow?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

export type GraphQL_Tag = {
  __typename?: 'Tag';
  _id: Scalars['ID'];
  contributors?: Maybe<GraphQL_TagContributors>;
  followersCount?: Maybe<Scalars['Int']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isApproved?: Maybe<Scalars['Boolean']>;
  leaderboard?: Maybe<GraphQL_TagLeaderBoard>;
  logo?: Maybe<Scalars['String']>;
  managers?: Maybe<Array<Maybe<GraphQL_TagManager>>>;
  name?: Maybe<Scalars['String']>;
  numPosts?: Maybe<Scalars['Int']>;
  posts?: Maybe<Array<Maybe<GraphQL_Post>>>;
  slug?: Maybe<Scalars['String']>;
  socialMedia?: Maybe<GraphQL_TagSocialMedia>;
  stats?: Maybe<GraphQL_TagStats>;
  tagline?: Maybe<Scalars['String']>;
  wiki?: Maybe<Scalars['String']>;
  wikiMarkdown?: Maybe<Scalars['String']>;
};


export type GraphQL_TagPostsArgs = {
  filter: GraphQL_TagsPostFilter;
  page?: InputMaybe<Scalars['Int']>;
};

export type GraphQL_TagCategory = {
  __typename?: 'TagCategory';
  _id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  priority?: Maybe<Scalars['Int']>;
  slug: Scalars['String'];
  tags?: Maybe<Array<Maybe<GraphQL_Tag>>>;
};

export type GraphQL_TagContributorLeaders = {
  __typename?: 'TagContributorLeaders';
  allTimeTopDevelopers?: Maybe<Array<Maybe<GraphQL_TagLeaderBoardMember>>>;
  monthlyTopDevelopers?: Maybe<Array<Maybe<GraphQL_TagLeaderBoardMember>>>;
};

export type GraphQL_TagContributors = {
  __typename?: 'TagContributors';
  leaders?: Maybe<GraphQL_TagContributorLeaders>;
  managers?: Maybe<Array<Maybe<GraphQL_TagManager>>>;
};

export type GraphQL_TagLeaderBoard = {
  __typename?: 'TagLeaderBoard';
  allTimeTopDevelopers?: Maybe<Array<Maybe<GraphQL_TagLeaderBoardMember>>>;
  monthlyTopDevelopers?: Maybe<Array<Maybe<GraphQL_TagLeaderBoardMember>>>;
};

export type GraphQL_TagLeaderBoardMember = {
  __typename?: 'TagLeaderBoardMember';
  appreciations?: Maybe<Scalars['Int']>;
  upvotes?: Maybe<Scalars['Int']>;
  user?: Maybe<GraphQL_User>;
};

export type GraphQL_TagManager = {
  __typename?: 'TagManager';
  _id: Scalars['ID'];
  role: Scalars['String'];
  user?: Maybe<GraphQL_User>;
};

export type GraphQL_TagSocialMedia = {
  __typename?: 'TagSocialMedia';
  github?: Maybe<Scalars['String']>;
  officialWebsite?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
};

export type GraphQL_TagStats = {
  __typename?: 'TagStats';
  currentWeekFollowersCount?: Maybe<Scalars['Int']>;
  currentWeekPostsCount?: Maybe<Scalars['Int']>;
  lastWeekFollowersCount?: Maybe<Scalars['Int']>;
  lastWeekPostsCount?: Maybe<Scalars['Int']>;
};

export type GraphQL_TagsInput = {
  _id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

export enum GraphQL_TagsPostFilter {
  Best = 'BEST',
  Hot = 'HOT',
  Recent = 'RECENT'
}

export type GraphQL_UpdateStoryInput = {
  contentMarkdown: Scalars['String'];
  coverImageURL?: InputMaybe<Scalars['String']>;
  isPartOfPublication: GraphQL_PublicationDetails;
  isRepublished?: InputMaybe<GraphQL_IsRepublished>;
  publishAs?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  sourcedFromGithub?: InputMaybe<Scalars['Boolean']>;
  subtitle?: InputMaybe<Scalars['String']>;
  tags: Array<InputMaybe<GraphQL_TagsInput>>;
  title: Scalars['String'];
};

export type GraphQL_User = {
  __typename?: 'User';
  _id: Scalars['ID'];
  blogHandle?: Maybe<Scalars['String']>;
  coverImage?: Maybe<Scalars['String']>;
  dateJoined?: Maybe<Scalars['String']>;
  followers?: Maybe<Array<Maybe<GraphQL_User>>>;
  isDeactivated?: Maybe<Scalars['Boolean']>;
  isEvangelist?: Maybe<Scalars['Boolean']>;
  location?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  numFollowers?: Maybe<Scalars['Int']>;
  numFollowing?: Maybe<Scalars['Int']>;
  numPosts?: Maybe<Scalars['Int']>;
  numReactions?: Maybe<Scalars['Int']>;
  photo?: Maybe<Scalars['String']>;
  publication?: Maybe<GraphQL_Publication>;
  publicationDomain?: Maybe<Scalars['String']>;
  socialMedia?: Maybe<GraphQL_SocialMedia>;
  tagline?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
};

export type GraphQL_CreateReplyInput = {
  contentInMarkdown: Scalars['String'];
  postId: Scalars['String'];
  responseId: Scalars['String'];
};

export type GraphQL_CreateReplyOutput = GraphQL_MutationOutput & {
  __typename?: 'createReplyOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  reply?: Maybe<GraphQL_Response>;
  success: Scalars['Boolean'];
};

export type GraphQL_CreateResponseInput = {
  contentInMarkdown: Scalars['String'];
  postId: Scalars['String'];
};

export type GraphQL_CreateResponseOutput = GraphQL_MutationOutput & {
  __typename?: 'createResponseOutput';
  code: Scalars['Int'];
  message: Scalars['String'];
  response?: Maybe<GraphQL_Response>;
  success: Scalars['Boolean'];
};

export type GraphQL_IsRepublished = {
  originalArticleURL: Scalars['String'];
};

export type GraphQL_GetPostsQueryVariables = Exact<{
  username: Scalars['String'];
}>;


export type GraphQL_GetPostsQuery = { __typename?: 'Query', user?: { __typename?: 'User', name?: string | null, photo?: string | null, publicationDomain?: string | null, publication?: { __typename?: 'Publication', posts?: Array<{ __typename?: 'Post', dateAdded?: string | null, cuid?: string | null, title?: string | null, brief?: string | null, coverImage: string, slug?: string | null } | null> | null } | null } | null };

export type GraphQL_GetUserQueryVariables = Exact<{
  username: Scalars['String'];
}>;


export type GraphQL_GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', publicationDomain?: string | null } | null };
