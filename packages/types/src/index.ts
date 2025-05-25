// User Management Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
  steamId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  inviteCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Game and Steam Types
export interface Game {
  id: string;
  steamAppId: number;
  name: string;
  description?: string;
  headerImage?: string;
  screenshots: string[];
  genres: string[];
  categories: string[];
  releaseDate?: Date;
  developer?: string;
  publisher?: string;
  price?: number;
  isInstalled: boolean;
  installSize?: number;
  lastPlayed?: Date;
  playtime: number;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconGray: string;
  achieved: boolean;
  achievedAt?: Date;
}

export interface SteamLibrary {
  userId: string;
  games: Game[];
  totalGames: number;
  totalPlaytime: number;
  lastSync: Date;
}

// Streaming Types
export interface StreamingSession {
  id: string;
  userId: string;
  gameId: string;
  status: StreamingStatus;
  quality: StreamingQuality;
  fps: number;
  bitrate: number;
  resolution: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  serverId: string;
  clientInfo: ClientInfo;
  metrics: StreamingMetrics;
}

export enum StreamingStatus {
  STARTING = 'starting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export enum StreamingQuality {
  LOW = '720p',
  MEDIUM = '1080p',
  HIGH = '1440p',
  ULTRA = '4K'
}

export interface ClientInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  networkType: string;
  location?: string;
}

export interface StreamingMetrics {
  avgFps: number;
  avgBitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  bandwidth: number;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
}

// Server and Infrastructure Types
export interface GameServer {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  status: ServerStatus;
  region: string;
  specs: ServerSpecs;
  currentLoad: number;
  maxConcurrentStreams: number;
  activeStreams: number;
  lastHeartbeat: Date;
  version: string;
}

export enum ServerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface ServerSpecs {
  cpu: string;
  gpu: string;
  ram: number;
  storage: number;
  network: string;
  os: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
  sessionId?: string;
}

export enum WebSocketMessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  
  // Streaming
  STREAM_START = 'stream_start',
  STREAM_STOP = 'stream_stop',
  STREAM_PAUSE = 'stream_pause',
  STREAM_RESUME = 'stream_resume',
  STREAM_METRICS = 'stream_metrics',
  
  // Game Control
  GAME_LAUNCH = 'game_launch',
  GAME_CLOSE = 'game_close',
  INPUT_EVENT = 'input_event',
  
  // System
  SERVER_STATUS = 'server_status',
  USER_STATUS = 'user_status',
  NOTIFICATION = 'notification'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Configuration Types
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: string;
    port: number;
    corsOrigin: string;
  };
  database: {
    url: string;
    maxConnections: number;
    ssl: boolean;
  };
  redis: {
    url: string;
    ttl: number;
  };
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    refreshSecret: string;
    refreshExpiry: string;
    bcryptRounds: number;
  };
  steam: {
    apiKey: string;
    webApiUrl: string;
  };
  streaming: {
    sunshinePort: number;
    defaultQuality: StreamingQuality;
    defaultFps: number;
    maxBitrate: number;
    hardwareAcceleration: boolean;
  };
  monitoring: {
    enabled: boolean;
    metricsPort: number;
    logLevel: string;
  };
}

// Analytics Types
export interface UserAnalytics {
  userId: string;
  totalPlaytime: number;
  sessionsCount: number;
  favoriteGames: string[];
  avgSessionDuration: number;
  lastActive: Date;
  deviceTypes: string[];
  locations: string[];
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalPlaytime: number;
  avgConcurrentUsers: number;
  popularGames: PopularGame[];
  serverLoad: ServerLoad[];
  networkMetrics: NetworkMetrics;
}

export interface PopularGame {
  gameId: string;
  name: string;
  playCount: number;
  totalPlaytime: number;
  avgRating: number;
}

export interface ServerLoad {
  serverId: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  networkUsage: number;
  activeStreams: number;
}

export interface NetworkMetrics {
  totalBandwidth: number;
  avgLatency: number;
  packetLoss: number;
  peakConcurrentStreams: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  GAME_UPDATE = 'game_update',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  ACHIEVEMENT = 'achievement'
}

// Input and Control Types
export interface InputEvent {
  type: InputEventType;
  data: any;
  timestamp: Date;
}

export enum InputEventType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  GAMEPAD = 'gamepad',
  TOUCH = 'touch'
}

export interface KeyboardEvent {
  key: string;
  code: string;
  pressed: boolean;
  modifiers: string[];
}

export interface MouseEvent {
  x: number;
  y: number;
  button?: number;
  pressed?: boolean;
  wheel?: number;
}

export interface GamepadEvent {
  index: number;
  buttons: boolean[];
  axes: number[];
}

// Settings Types
export interface UserSettings {
  userId: string;
  streaming: StreamingSettings;
  controls: ControlSettings;
  audio: AudioSettings;
  video: VideoSettings;
  notifications: NotificationSettings;
}

export interface StreamingSettings {
  preferredQuality: StreamingQuality;
  preferredFps: number;
  adaptiveQuality: boolean;
  hardwareDecoding: boolean;
  lowLatencyMode: boolean;
}

export interface ControlSettings {
  keyboardLayout: string;
  mouseSettings: MouseSettings;
  gamepadSettings: GamepadSettings;
  touchControls: boolean;
}

export interface MouseSettings {
  sensitivity: number;
  acceleration: boolean;
  invertY: boolean;
}

export interface GamepadSettings {
  deadzone: number;
  vibration: boolean;
  layout: string;
}

export interface AudioSettings {
  volume: number;
  muted: boolean;
  quality: string;
  channels: number;
}

export interface VideoSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hdr: boolean;
  vsync: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  gameUpdates: boolean;
  achievements: boolean;
  systemAlerts: boolean;
  email: boolean;
  push: boolean;
} 