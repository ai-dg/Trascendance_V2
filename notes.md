 Remote Player, Match Making, Tournament
 ---
  PHASE 1: Match-Maker Service Core 🎮

  1.1 Queue Management (Redis-based)

  File: srcs/services/match-maker/app/srcs/QueueManager.js

  Implement:
  - Add players to Redis sorted set: matchmaking:queue (scored by timestamp)
  - Store player metadata: matchmaking:player:{userId} (preferences, connection info)
  - Handle queue join/leave operations
  - Track queue statistics (length, wait times)

  Data structures:
  // Redis keys
  matchmaking:queue -> ZADD userId timestamp
  matchmaking:player:{userId} -> HSET {socketId, pseudo, joinedAt}
  matchmaking:active_matches -> SET of gameUUIDs

  1.2 Pairing Algorithm

  File: srcs/services/match-maker/app/srcs/MatchMaker.js

  Implement:
  - Polling mechanism (every 1-2 seconds)
  - Simple FIFO pairing: Pop 2 oldest players from queue
  - Generate game UUID for matched pair
  - Store match metadata in Redis
  - Emit match-found events to both players

  Future enhancements: Skill-based matching (ELO), preference matching

  1.3 Match-Maker REST & Socket.IO Endpoints

  File: srcs/services/match-maker/app/server.js

  REST Endpoints:
  - POST /match-maker/queue/join - Join matchmaking queue
  - POST /match-maker/queue/leave - Leave queue
  - GET /match-maker/queue/status - Get queue position/stats

  Socket.IO Events:
  - join-queue - Player joins matchmaking
  - leave-queue - Player cancels search
  - match-found - Emit to both players with game UUID
  - queue-status - Periodic queue position updates

  1.4 Timeout & Cleanup Logic

  Implement:
  - Remove players inactive >30 seconds
  - Handle disconnections gracefully
  - Clean up abandoned matches
  - Redis key expiration (TTL)

  ---
  PHASE 2: Remote-Players Service Updates 🕹️

  2.1 Add "online" Game Type Support

  File: srcs/services/remote-players/app/server.js

  Modify game-request handler:
  // Current: Only handles type "local"
  // Add: Handle type "online"
  case 'online':
    // Wait for match-maker to assign opponent
    // Don't create game immediately
    // Store socket mapping: userId -> socketId

  2.2 Match Assignment Handler

  File: srcs/services/remote-players/app/srcs/MatchHandler.js

  Implement:
  - Listen for match-maker assignments (RabbitMQ or direct Redis)
  - Create GameManager with pre-assigned players
  - Assign Player 1/Player 2 roles
  - Emit game-assigned to both sockets with UUID
  - Handle case where one player disconnects before game starts

  2.3 Game Room Management

  File: srcs/services/remote-players/app/srcs/GameRoomManager.js

  Implement:
  - Move games from in-memory Map to Redis (for multi-instance scaling)
  - Track active games: games:active:{uuid}
  - Handle concurrent games (currently limited)
  - Cleanup finished/abandoned games
  - Store game results for history/stats

  2.4 Reconnection Logic

  Implement:
  - Allow players to reconnect mid-game
  - Store game UUID in Redis: player:game:{userId} -> gameUUID
  - Resume game state on reconnect
  - Handle timeout if both players disconnect

  ---
  PHASE 3: Frontend Integration 🖥️

  3.1 Online Game Mode UI

  File: srcs/services/frontend/app/public/src/js/pages/OnlineGame.js

  Implement:
  - Replace "under construction" message
  - "Find Match" button
  - Queue status display (searching, queue position, estimated wait)
  - "Cancel Search" button
  - Match found notification/animation

  3.2 Matchmaking Socket.IO Client

  File: srcs/services/frontend/app/public/src/js/utils/matchmaking-socket.js

  Implement:
  // Connect to match-maker service
  const matchSocket = io('https://localhost/match-maker', {
    withCredentials: true
  });

  // Emit join-queue
  matchSocket.emit('join-queue', {userId, preferences});

  // Listen for match-found
  matchSocket.on('match-found', ({gameUUID, role}) => {
    // Connect to remote-players
    // Join game room
  });

  3.3 Game Connection Flow

  Modify: srcs/services/frontend/app/public/src/js/pages/RemoteGame.js

  Update:
  - Accept gameUUID and role from matchmaking
  - Connect to remote-players with UUID
  - Handle opponent disconnect notifications
  - Show opponent pseudo/info
  - Add "Return to Menu" on disconnect

  3.4 Waiting Screen

  New component: Animated waiting screen while searching
  - Show queue position
  - Spinning loader
  - "Players searching: X"
  - Cancel button

  ---
  PHASE 4: Service Integration 🔗

  4.1 Gateway Routing

  File: srcs/reverse-proxy/nginx.conf

  Add Socket.IO routing for match-maker:
  location /socket.io/ {
      # Currently only routes to live-chat
      # Add routing logic for match-maker namespace
  }

  4.2 RabbitMQ Match Queue

  Implement:
  - New queue: match-found-queue
  - Match-maker publishes match events
  - Remote-players consumes and creates games
  - Alternative: Direct Redis pub/sub

  4.3 Redis Pub/Sub (Alternative)

  Implement:
  - Match-maker publishes to match:found channel
  - Remote-players subscribes and handles
  - Lighter weight than RabbitMQ for this use case

  4.4 Cross-Service Communication

  Ensure:
  - Match-maker can query user data from auth service
  - Remote-players can verify match validity
  - Services share Redis for state consistency

  ---
  PHASE 5: Polish & Edge Cases ✨

  5.1 Error Handling

  - Player disconnects during queue
  - Player disconnects after match found but before game starts
  - Game server crashes mid-game
  - Redis/RabbitMQ connection failures

  5.2 User Feedback

  - Toast notifications for match found
  - Sound effects (optional)
  - Queue statistics ("Avg wait: 30s")
  - Opponent info display

  5.3 Testing

  - Unit tests for pairing algorithm
  - Integration tests for match flow
  - Load testing (simulate 100+ concurrent players)
  - Edge case testing (disconnects, timeouts)

  5.4 Monitoring & Logging

  - Queue length metrics
  - Average wait time
  - Match success rate
  - Game completion rate
  - Player retention stats

  ---
  PHASE 6: Future Enhancements 🚀

  6.1 Skill-Based Matchmaking

  - Implement ELO/MMR system
  - Store player ratings in database
  - Match players within skill range
  - Update ratings after games

  6.2 Game Modes & Preferences

  - Ranked vs Casual queues
  - Game speed preferences
  - Tournament mode
  - Custom game settings

  6.3 Reconnection & Spectating

  - Full reconnection support mid-game
  - Spectator mode for friends
  - Replay system

  6.4 Leaderboards & Stats

  - Global leaderboards
  - Personal match history
  - Win/loss statistics
  - Achievements

  ---
  📋 RECOMMENDED IMPLEMENTATION ORDER

  1. Start Simple: FIFO queue with basic pairing (Phase 1.1, 1.2)
  2. Test Core Flow: Match-maker → assignment → game creation (Phase 2.1, 2.2)
  3. Add Frontend: Online mode UI and socket connection (Phase 3.1, 3.2, 3.3)
  4. Integrate Services: Gateway routing, communication layer (Phase 4)
  5. Handle Edge Cases: Disconnects, timeouts, errors (Phase 5.1)
  6. Polish: UI/UX improvements, notifications (Phase 5.2)
  7. Enhance: Skill-based matching, preferences (Phase 6)

  ---
  🔧 TECHNICAL DECISIONS TO MAKE

  1. Communication Pattern: RabbitMQ vs Redis Pub/Sub for match notifications?
    - Recommendation: Redis Pub/Sub (simpler, already using Redis)
  2. Game Storage: In-memory Map vs Redis for active games?
    - Recommendation: Redis (enables multi-instance scaling)
  3. Queue Algorithm: Simple FIFO vs Skill-based?
    - Recommendation: Start with FIFO, add ELO later
  4. Timeout Values: How long before removing inactive players?
    - Recommendation: 30s queue timeout, 10s game-start timeout
