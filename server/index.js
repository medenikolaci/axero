const express = require('express');
const cors = require('cors');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = 3001;

// --- Configurazione LowDB (Database JSON) ---
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {
    users: [],
    friendships: [],
    messages: [],
    stories: [],
    posts: [],
    videos: [],
    streaks: {},
    activities: [] 
});

const getRandomImageId = () => Math.floor(Math.random() * 1000) + 1;

async function initializeDb() {
    await db.read();

    // Questo blocco garantisce che 'activities' sia sempre un array dopo la lettura,
    // anche se db.json è stato creato da una versione precedente del codice senza 'activities'.
    if (!db.data.activities) {
        db.data.activities = [];
        console.log("Campo 'activities' aggiunto al database esistente.");
        await db.write(); 
    }

    if (!db.data.users || db.data.users.length === 0) {
        console.log("Inizializzazione del database con seed users e dati di esempio...");

        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        const sampleVideoPaths = ['sample_video_1.mp4', 'sample_video_2.mp4'];
        sampleVideoPaths.forEach(videoFile => {
            const filePath = path.join(uploadsDir, videoFile);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, ''); 
                console.log(`Creato file placeholder video: ${videoFile}. Assicurati di aggiungere i file video reali nella cartella uploads!`);
            }
        });

        const seedUsers = [
            { id: uuidv4(), username: 'devuser', password: 'devpassword', name: 'Dev_User', avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100` },
            { id: uuidv4(), username: 'cyber_anna', password: 'password1', name: 'Anna_X', avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100` },
            { id: uuidv4(), username: 'digital_marco', password: 'password2', name: 'Marco_Z', avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100` },
            { id: uuidv4(), username: 'quantum_elena', password: 'password3', name: 'Elena_K', avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100` },
            { id: uuidv4(), username: 'code_luca', password: 'password4', name: 'Luca_G', avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100` },
        ];

        db.data.users = seedUsers;

        const devUserId = seedUsers[0].id;

        db.data.friendships.push(
            { user1Id: devUserId, user2Id: seedUsers[1].id },
            { user1Id: devUserId, user2Id: seedUsers[2].id }
        );

        db.data.messages.push(
            { id: uuidv4(), conversationId: seedUsers[1].id, senderId: devUserId, content: 'Cybernetic greetings, Anna. System status: optimal. 🚀', mediaPath: null, timestamp: Date.now() - 3600000, readStatus: 2 },
            { id: uuidv4(), conversationId: seedUsers[1].id, senderId: seedUsers[1].id, content: 'Processor online, Dev_User! Initiating data transfer sequence. 💾', mediaPath: null, timestamp: Date.now() - 3500000, readStatus: 2 },
            { id: uuidv4(), conversationId: seedUsers[2].id, senderId: devUserId, content: 'Protocol Marco, any new digital artifacts found? 🖼️', mediaPath: null, timestamp: Date.now() - 7200000, readStatus: 2 },
            { id: uuidv4(), conversationId: seedUsers[2].id, senderId: seedUsers[2].id, content: 'Affirmative! Accessing recent network captures. Ready for sync. ✨', mediaPath: null, timestamp: Date.now() - 7100000, readStatus: 2 },
            { id: uuidv4(), conversationId: seedUsers[3].id, senderId: seedUsers[3].id, content: 'Quantum_Elena online. New data stream detected. Analysis complete. 📊', mediaPath: null, timestamp: Date.now() - 60000, readStatus: 0 },
        );

        db.data.stories.push(
            { id: uuidv4(), userId: seedUsers[1].id, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/1000`, timestamp: Date.now() - 10000, expiryTime: Date.now() + (23 * 3600000), viewsCount: 15, likes: [], type: 'image' }, 
            { id: uuidv4(), userId: seedUsers[2].id, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/1000`, timestamp: Date.now() - 20000, expiryTime: Date.now() + (22 * 3600000), viewsCount: 20, likes: [], type: 'image' }, 
            { id: uuidv4(), userId: seedUsers[3].id, mediaPath: `http://localhost:${PORT}/uploads/sample_video_1.mp4`, timestamp: Date.now() - 15000, expiryTime: Date.now() + (22.5 * 3600000), viewsCount: 10, likes: [], type: 'video' }, 
            { id: uuidv4(), userId: devUserId, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/1000`, timestamp: Date.now() - 2000, expiryTime: Date.now() + (23.9 * 3600000), viewsCount: 0, likes: [], type: 'image' }, 
        );

        db.data.posts.push(
            { id: uuidv4(), userId: seedUsers[1].id, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/400`, caption: 'Synthesized landscapes. Data visualization complete. #DigitalArt #FutureScape', timestamp: Date.now() - 5 * 24 * 3600000, likes: [], 
                comments: [{id: uuidv4(), userId: devUserId, content: 'Amazing capture!', timestamp: Date.now() - 4 * 24 * 3600000}], 
                type: 'image' }, 
            { id: uuidv4(), userId: seedUsers[2].id, mediaPath: `http://localhost:${PORT}/uploads/sample_video_2.mp4`, caption: 'New code compiled. Executing test sequence. Bug analysis ongoing. #CodingLife #BinaryFlow', timestamp: Date.now() - 2 * 24 * 3600000, likes: [], 
                comments: [], 
                type: 'video' }, 
            { id: uuidv4(), userId: seedUsers[3].id, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/400`, caption: 'Neural network optimizations. Achieving peak performance. #AI #MachineLearning', timestamp: Date.now() - 1 * 24 * 3600000, likes: [], 
                comments: [{id: uuidv4(), userId: devUserId, content: 'Deep learning in action!', timestamp: Date.now() - 1 * 24 * 3600000 + 5000}],
                type: 'image' }, 
            { id: uuidv4(), userId: devUserId, mediaPath: `https://picsum.photos/id/${getRandomImageId()}/600/400`, caption: 'System online. Initializing social protocol. Hello, digital realm. ✨', timestamp: Date.now(), likes: [], 
                comments: [], 
                type: 'image' }, 
        );

        db.data.videos.push(
            { id: uuidv4(), userId: seedUsers[1].id, mediaPath: `http://localhost:${PORT}/uploads/sample_video_1.mp4`, title: 'Digital World Exploration Log 001', timestamp: Date.now() - 12 * 3600000, likes: [], viewsCount: 1500, 
                comments: [{id: uuidv4(), userId: devUserId, content: 'Superb data flow!', timestamp: Date.now() - 11 * 3600000}], 
                }, 
            { id: uuidv4(), userId: seedUsers[2].id, mediaPath: `http://localhost:${PORT}/uploads/sample_video_2.mp4`, title: 'Binary Dance Protocol Activated', timestamp: Date.now() - 2 * 3600000, likes: [], viewsCount: 900, 
                comments: [], 
                }, 
            { id: uuidv4(), userId: seedUsers[3].id, mediaPath: `http://localhost:${PORT}/uploads/sample_video_1.mp4`, title: 'Optimizing Human Performance: Beta Test', timestamp: Date.now() - 1 * 3600000, likes: [], viewsCount: 2500, 
                comments: [], 
                }, 
            { id: uuidv4(), userId: devUserId, mediaPath: `http://localhost:${PORT}/uploads/sample_video_2.mp4`, title: 'First Upload: Cybernetic Journey Begins', timestamp: Date.now() - 1000, likes: [], viewsCount: 0, 
                comments: [], 
                }, 
        );

        db.data.streaks = {
            [`${devUserId}_${seedUsers[1].id}`]: { currentStreak: 3, lastInteractionTimestamp: Date.now() - (12 * 3600000) },
        };

        db.data.activities = [
            { id: uuidv4(), type: 'like', fromUser: { id: seedUsers[2].id, name: seedUsers[2].name, avatar: seedUsers[2].avatar }, target: { type: 'post', id: db.data.posts.find(p => p.userId === devUserId).id, media: db.data.posts.find(p => p.userId === devUserId).mediaPath, userId: devUserId }, timestamp: Date.now() - 10000 },
            { id: uuidv4(), type: 'follow', fromUser: { id: seedUsers[3].id, name: seedUsers[3].name, avatar: seedUsers[3].avatar }, target: { type: 'user', id: devUserId, name: 'You' }, timestamp: Date.now() - 30000 },
            { id: uuidv4(), type: 'comment', fromUser: { id: seedUsers[1].id, name: seedUsers[1].name, avatar: seedUsers[1].avatar }, target: { type: 'post', id: db.data.posts.find(p => p.userId === devUserId).id, media: db.data.posts.find(p => p.userId === devUserId).mediaPath, userId: devUserId }, commentContent: 'Excellent data structure!', timestamp: Date.now() - 60000 },
            { id: uuidv4(), type: 'like', fromUser: { id: seedUsers[4].id, name: seedUsers[4].name, avatar: seedUsers[4].avatar }, target: { type: 'story', id: db.data.stories.find(s => s.userId === devUserId).id, media: db.data.stories.find(s => s.userId === devUserId).mediaPath, userId: devUserId }, timestamp: Date.now() - 120000 },
        ];
        
        await db.write();
        console.log("Database inizializzato e scritto con dati di esempio.");
    } else {
        console.log("Database già esistente, nessun'inizializzazione necessaria.");
        const devUser = db.data.users.find(u => u.username === 'devuser');
        if (devUser) {
            // Aggiorna 'activities' e altri campi se mancanti nel db esistente
            if (!db.data.activities) db.data.activities = [];
            if (!db.data.posts.every(p => Array.isArray(p.likes))) db.data.posts.forEach(p => p.likes = p.likes || []);
            if (!db.data.posts.every(p => Array.isArray(p.comments))) db.data.posts.forEach(p => p.comments = p.comments || []);
            if (!db.data.videos.every(v => Array.isArray(v.likes))) db.data.videos.forEach(v => v.likes = v.likes || []);
            if (!db.data.videos.every(v => Array.isArray(v.comments))) db.data.videos.forEach(v => v.comments = v.comments || []);
            if (!db.data.stories.every(s => Array.isArray(s.likes))) db.data.stories.forEach(s => s.likes = s.likes || []);


            db.data.activities = db.data.activities.map(activity => {
                if (activity.target && activity.target.type === 'user' && activity.target.name === 'You' && activity.target.id !== devUser.id) {
                    return { ...activity, target: { ...activity.target, id: devUser.id } };
                }
                return activity;
            });
            await db.write();
        }
    }
}
initializeDb();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configurazione Multer per upload file ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + uuidv4();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API Autenticazione e Utenti ---
app.post('/api/register', async (req, res) => {
    await db.read();
    const { username, password, name } = req.body;

    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'Username already taken.' });
    }

    const newUser = {
        id: uuidv4(),
        username,
        password,
        name: name || username,
        avatar: `https://picsum.photos/id/${getRandomImageId()}/100/100`
    };

    db.data.users.push(newUser);
    await db.write();
    res.status(201).json({ message: 'User registered successfully. Please login.', userId: newUser.id });
});

app.post('/api/login', async (req, res) => {
    await db.read();
    const { username, password } = req.body;
    const user = db.data.users.find(u => u.username === username && u.password === password);

    if (user) {
        res.status(200).json({ message: 'Login successful!', token: 'dummy-token-for-personal-app', userId: user.id, userName: user.name, userAvatar: user.avatar });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

app.get('/api/me/:userId', async (req, res) => {
    await db.read();
    const { userId } = req.params;
    const user = db.data.users.find(u => u.id === userId);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: `User ID ${userId} not found.` });
    }
});

app.post('/api/me/update', async (req, res) => {
    await db.read();
    const { userId, name, avatar } = req.body; 

    const user = db.data.users.find(u => u.id === userId);
    if (user) {
        user.name = name || user.name;
        user.avatar = avatar || user.avatar;
        await db.write();
        res.json({ message: 'Profile updated successfully!', user: user });
    } else {
        res.status(404).json({ message: `User ID ${userId} not found.` });
    }
});

// --- API Ricerca Utenti ---
app.get('/api/users/search', async (req, res) => {
    await db.read();
    const { query, currentUserId } = req.query;

    if (!query || query.length < 2) {
        return res.json([]);
    }

    const lowerCaseQuery = query.toLowerCase();
    const userFriendships = db.data.friendships.filter(f => f.user1Id === currentUserId || f.user2Id === currentUserId);
    const friendIds = new Set(userFriendships.map(f => f.user1Id === currentUserId ? f.user2Id : f.user1Id));

    const results = db.data.users.filter(user => 
        user.id !== currentUserId && 
        !friendIds.has(user.id) && 
        (user.username.toLowerCase().includes(lowerCaseQuery) || 
         user.name.toLowerCase().includes(lowerCaseQuery))
    ).map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
    }));

    res.json(results);
});

// --- API Amicizie (Modificata per includere tutti i contatti delle chat) ---
app.get('/api/friends/:userId', async (req, res) => {
    await db.read();
    const { userId } = req.params;

    const contactIds = new Set();

    // 1. Aggiungi gli ID dagli amici espliciti (friendships)
    db.data.friendships.forEach(f => {
        if (f.user1Id === userId) {
            contactIds.add(f.user2Id);
        } else if (f.user2Id === userId) {
            contactIds.add(f.user1Id);
        }
    });

    // 2. Aggiungi gli ID degli utenti con cui hai scambiato messaggi (conversazioni implicite)
    db.data.messages.forEach(msg => {
        if (msg.senderId === userId) {
            contactIds.add(msg.conversationId); 
        } else if (msg.conversationId === userId) { // Messaggi ricevuti da altri
            contactIds.add(msg.senderId); 
        }
    });

    // Rimuovi l'utente stesso dalla lista dei contatti
    contactIds.delete(userId);

    // Prendi i dettagli degli utenti unici trovati
    const contacts = db.data.users.filter(u => contactIds.has(u.id))
                                 .map(u => ({ id: u.id, username: u.username, name: u.name, avatar: u.avatar }));
    
    // Ordina i contatti in base all'ultima attività di messaggio per simulare una lista chat recente
    const contactsWithLastMessageTime = contacts.map(contact => {
        const lastMessage = db.data.messages
            .filter(msg => 
                (msg.senderId === userId && msg.conversationId === contact.id) ||
                (msg.senderId === contact.id && msg.conversationId === userId)
            )
            .sort((a, b) => b.timestamp - a.timestamp)[0]; 

        return {
            ...contact,
            lastMessageTimestamp: lastMessage ? lastMessage.timestamp : 0 
        };
    });

    contactsWithLastMessageTime.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

    res.json(contactsWithLastMessageTime);
});

// --- API per Messaggi (Chat WhatsApp-like) ---
app.get('/api/messages/:conversationId', async (req, res) => {
    await db.read();
    const { conversationId } = req.params;
    const { userId } = req.query; // Aggiunto per filtrare correttamente i messaggi tra i due utenti

    const conversationMessages = db.data.messages.filter(msg => 
        (msg.conversationId === conversationId && msg.senderId === userId) || // Messaggi inviati dall'utente a conversationId
        (msg.conversationId === userId && msg.senderId === conversationId)    // Messaggi inviati da conversationId all'utente
    ).sort((a,b) => a.timestamp - b.timestamp); // Ordina per timestamp

    res.json(conversationMessages);
});

app.post('/api/messages', upload.single('media'), async (req, res) => {
    await db.read();
    const { conversationId, senderId, content } = req.body;
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;

    const newMessage = {
        id: uuidv4(),
        conversationId, // L'ID del destinatario
        senderId,       // L'ID del mittente
        content: content || null,
        mediaPath,
        timestamp: Date.now(),
        readStatus: 0
    };
    db.data.messages.push(newMessage);

    // Auto-risposta per i messaggi di prova
    if (content && senderId !== conversationId) { // Assicurati di non auto-rispondere a te stesso
        const recipientUser = db.data.users.find(u => u.id === conversationId); // Trova il destinatario reale
        const senderUser = db.data.users.find(u => u.id === senderId); // Trova il mittente reale

        if (recipientUser && senderUser) {
            setTimeout(async () => {
                await db.read(); 
                db.data.messages.push({
                    id: uuidv4(),
                    conversationId: senderId, // La conversazione è l'ID del mittente originale
                    senderId: conversationId, // Il mittente è il destinatario originale
                    content: `(Response from ${recipientUser.name}): Acknowledgment protocol initiated. Message received. 🤖`,
                    mediaPath: null,
                    timestamp: Date.now() + 1000, 
                    readStatus: 0
                });
                await db.write();
            }, 1500);
        }
    }

    await db.write();
    res.status(201).json(newMessage);
});

// --- API per Storie (Instagram/Snapchat-like) ---
app.post('/api/stories', upload.single('media'), async (req, res) => {
    await db.read();
    const { userId } = req.body;
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : `https://picsum.photos/id/${getRandomImageId()}/600/1000`;
    const timestamp = Date.now();
    const expiryTime = timestamp + (24 * 60 * 60 * 1000); 

    const newStory = {
        id: uuidv4(),
        userId,
        mediaPath,
        timestamp,
        expiryTime,
        viewsCount: 0,
        likes: [], 
        type: req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : 'image'
    };
    db.data.stories.push(newStory);

    await db.write();
    res.status(201).json(newStory);
});

app.get('/api/stories', async (req, res) => {
    await db.read();
    const activeStories = db.data.stories.filter(story => story.expiryTime > Date.now());

    const groupedStories = {};
    activeStories.forEach(story => {
        if (!groupedStories[story.userId]) {
            groupedStories[story.userId] = [];
        }
        groupedStories[story.userId].push(story);
    });

    const sortedUsers = Object.keys(groupedStories).sort((a, b) => {
        const lastStoryA = Math.max(...groupedStories[a].map(s => s.timestamp));
        const lastStoryB = Math.max(...groupedStories[b].map(s => s.timestamp));
        return lastStoryB - lastStoryA;
    });

    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const result = sortedUsers.map(userId => ({
        user: userMap[userId] || { id: userId, name: 'Unknown_Unit', avatar: `https://picsum.photos/id/${getRandomImageId()}/50/50` },
        stories: groupedStories[userId].map(story => ({ 
            ...story,
            likesCount: Array.isArray(story.likes) ? story.likes.length : 0 
        }))
    }));

    res.json(result);
});

// NUOVO ENDPOINT: LIKE PER LE STORIE
app.post('/api/stories/:storyId/like', async (req, res) => {
    await db.read();
    const { storyId } = req.params;
    const { userId } = req.body;

    const story = db.data.stories.find(s => s.id === storyId);

    if (!story) {
        return res.status(404).json({ message: 'Story not found.' });
    }

    if (!Array.isArray(story.likes)) {
        story.likes = [];
    }

    const userIndex = story.likes.indexOf(userId);
    let action = '';

    if (userIndex === -1) {
        story.likes.push(userId);
        action = 'liked';

        const likerUser = db.data.users.find(u => u.id === userId);
        if (likerUser) {
            const storyOwner = db.data.users.find(u => u.id === story.userId);
            if (storyOwner && storyOwner.id !== likerUser.id) { 
                db.data.activities.push({
                    id: uuidv4(),
                    type: 'like',
                    fromUser: { id: likerUser.id, name: likerUser.name, avatar: likerUser.avatar },
                    target: { type: 'story', id: story.id, media: story.mediaPath, userId: story.userId, ownerName: storyOwner.name },
                    timestamp: Date.now()
                });
            }
        }
    } else {
        story.likes.splice(userIndex, 1);
        action = 'unliked';
    }
    
    await db.write();
    res.status(200).json({ 
        message: `Story ${action} successfully!`, 
        newLikesCount: story.likes.length, 
        likedByUser: action === 'liked' 
    });
});


// POST
app.post('/api/posts', upload.single('media'), async (req, res) => {
    await db.read();
    const { userId, caption } = req.body;
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : `https://picsum.photos/id/${getRandomImageId()}/600/400`;
    
    const newPost = {
        id: uuidv4(),
        userId,
        mediaPath,
        caption,
        timestamp: Date.now(),
        likes: [], 
        comments: [], 
        type: req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : 'image'
    };
    db.data.posts.push(newPost);
    await db.write();
    res.status(201).json(newPost);
});

app.get('/api/posts', async (req, res) => {
    await db.read();
    let allPosts = db.data.posts;
    
    const { userId } = req.query; 
    if (userId) {
        allPosts = allPosts.filter(post => post.userId === userId);
    }

    allPosts.sort((a, b) => b.timestamp - a.timestamp); 

    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const postsWithUsers = allPosts.map(post => ({
        ...post,
        likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
        commentsCount: Array.isArray(post.comments) ? post.comments.length : 0, 
        user: userMap[post.userId] || { id: post.userId, name: 'Unknown_Unit', avatar: `https://picsum.photos/id/${getRandomImageId()}/50/50` }
    }));

    res.json(postsWithUsers);
});

// NUOVO ENDPOINT: LIKE PER I POST
app.post('/api/posts/:postId/like', async (req, res) => {
    await db.read();
    const { postId } = req.params;
    const { userId } = req.body;

    const post = db.data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }

    if (!Array.isArray(post.likes)) {
        post.likes = [];
    }

    const userIndex = post.likes.indexOf(userId);
    let action = '';

    if (userIndex === -1) {
        post.likes.push(userId);
        action = 'liked';

        const likerUser = db.data.users.find(u => u.id === userId);
        if (likerUser) {
            const postOwner = db.data.users.find(u => u.id === post.userId);
            if (postOwner && postOwner.id !== likerUser.id) { 
                db.data.activities.push({
                    id: uuidv4(),
                    type: 'like',
                    fromUser: { id: likerUser.id, name: likerUser.name, avatar: likerUser.avatar },
                    target: { type: 'post', id: post.id, media: post.mediaPath, userId: post.userId, ownerName: postOwner.name },
                    timestamp: Date.now()
                });
            }
        }
    } else {
        post.likes.splice(userIndex, 1);
        action = 'unliked';
    }
    
    await db.write();
    res.status(200).json({ 
        message: `Post ${action} successfully!`, 
        newLikesCount: post.likes.length, 
        likedByUser: action === 'liked' 
    });
});

// GET COMMENTS FOR POST
app.get('/api/posts/:postId/comments', async (req, res) => {
    await db.read();
    const { postId } = req.params;
    const post = db.data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    
    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const enrichedComments = (post.comments || []).map(comment => ({
        ...comment,
        user: userMap[comment.userId] || { id: comment.userId, name: 'Unknown_Unit', avatar: `https://picsum.photos/id/${getRandomImageId()}/50/50` }
    })).sort((a,b) => a.timestamp - b.timestamp); 

    res.json(enrichedComments);
});

// POST COMMENT FOR POST
app.post('/api/posts/:postId/comments', async (req, res) => {
    await db.read();
    const { postId } = req.params;
    const { userId, content } = req.body;

    const post = db.data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    if (!Array.isArray(post.comments)) {
        post.comments = [];
    }

    const newComment = {
        id: uuidv4(),
        userId,
        content,
        timestamp: Date.now()
    };
    post.comments.push(newComment);

    const commenterUser = db.data.users.find(u => u.id === userId);
    if (commenterUser) {
        const postOwner = db.data.users.find(u => u.id === post.userId);
        if (postOwner && postOwner.id !== commenterUser.id) { 
            db.data.activities.push({
                id: uuidv4(),
                type: 'comment',
                fromUser: { id: commenterUser.id, name: commenterUser.name, avatar: commenterUser.avatar },
                target: { type: 'post', id: post.id, media: post.mediaPath, userId: post.userId, ownerName: postOwner.name },
                commentContent: content,
                timestamp: Date.now()
            });
        }
    }
    
    await db.write();
    res.status(201).json({ message: 'Comment added successfully!', newComment: newComment });
});


// VIDEO
app.post('/api/videos', upload.single('media'), async (req, res) => {
    await db.read();
    const { userId, title } = req.body;
    const randomSampleVideo = Math.random() < 0.5 ? 'sample_video_1.mp4' : 'sample_video_2.mp4';
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : `http://localhost:${PORT}/uploads/${randomSampleVideo}`;
    
    const newVideo = {
        id: uuidv4(),
        userId,
        mediaPath,
        title: title || 'Untitled_Data_Stream',
        timestamp: Date.now(),
        likes: [], 
        viewsCount: 0,
        comments: [], 
    };
    db.data.videos.push(newVideo);
    await db.write();
    res.status(201).json(newVideo);
});

app.get('/api/videos', async (req, res) => {
    await db.read();
    let allVideos = db.data.videos;

    const { userId } = req.query; 
    if (userId) {
        allVideos = allVideos.filter(video => video.userId === userId);
    }

    allVideos.sort(() => Math.random() - 0.5); 

    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const videosWithUsers = allVideos.map(video => ({
        ...video,
        likesCount: Array.isArray(video.likes) ? video.likes.length : 0,
        commentsCount: Array.isArray(video.comments) ? video.comments.length : 0, 
        user: userMap[video.userId] || { id: video.userId, name: 'Unknown_Unit', avatar: `https://picsum.photos/id/${getRandomImageId()}/50/50` }
    }));

    res.json(videosWithUsers);
});

// NUOVO ENDPOINT: LIKE PER I VIDEO
app.post('/api/videos/:videoId/like', async (req, res) => {
    await db.read();
    const { videoId } = req.params;
    const { userId } = req.body;

    const video = db.data.videos.find(v => v.id === videoId);

    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }

    if (!Array.isArray(video.likes)) {
        video.likes = [];
    }

    const userIndex = video.likes.indexOf(userId);
    let action = '';

    if (userIndex === -1) {
        video.likes.push(userId);
        action = 'liked';

        const likerUser = db.data.users.find(u => u.id === userId);
        if (likerUser) {
            const videoOwner = db.data.users.find(u => u.id === video.userId);
            if (videoOwner && videoOwner.id !== likerUser.id) { 
                db.data.activities.push({
                    id: uuidv4(),
                    type: 'like',
                    fromUser: { id: likerUser.id, name: likerUser.name, avatar: likerUser.avatar },
                    target: { type: 'video', id: video.id, media: video.mediaPath, userId: video.userId, ownerName: videoOwner.name },
                    timestamp: Date.now()
                });
            }
        }
    } else {
        video.likes.splice(userIndex, 1);
        action = 'unliked';
    }
    
    await db.write();
    res.status(200).json({ 
        message: `Video ${action} successfully!`, 
        newLikesCount: video.likes.length, 
        likedByUser: action === 'liked' 
    });
});

// GET COMMENTS FOR VIDEO
app.get('/api/videos/:videoId/comments', async (req, res) => {
    await db.read();
    const { videoId } = req.params;
    const video = db.data.videos.find(v => v.id === videoId);

    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }
    
    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const enrichedComments = (video.comments || []).map(comment => ({
        ...comment,
        user: userMap[comment.userId] || { id: comment.userId, name: 'Unknown_Unit', avatar: `https://picsum.photos/id/${getRandomImageId()}/50/50` }
    })).sort((a,b) => a.timestamp - b.timestamp);

    res.json(enrichedComments);
});

// POST COMMENT FOR VIDEO
app.post('/api/videos/:videoId/comments', async (req, res) => {
    await db.read();
    const { videoId } = req.params;
    const { userId, content } = req.body;

    const video = db.data.videos.find(v => v.id === videoId);

    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }
    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    if (!Array.isArray(video.comments)) {
        video.comments = [];
    }

    const newComment = {
        id: uuidv4(),
        userId,
        content,
        timestamp: Date.now()
    };
    video.comments.push(newComment);

    const commenterUser = db.data.users.find(u => u.id === userId);
    if (commenterUser) {
        const videoOwner = db.data.users.find(u => u.id === video.userId);
        if (videoOwner && videoOwner.id !== commenterUser.id) { 
            db.data.activities.push({
                id: uuidv4(),
                type: 'comment',
                fromUser: { id: commenterUser.id, name: commenterUser.name, avatar: commenterUser.avatar },
                target: { type: 'video', id: video.id, media: video.mediaPath, userId: video.userId, ownerName: videoOwner.name },
                commentContent: content,
                timestamp: Date.now()
            });
        }
    }
    
    await db.write();
    res.status(201).json({ message: 'Comment added successfully!', newComment: newComment });
});

// STREAK (Stato Infuocato)
app.get('/api/streaks/:user1Id/:user2Id', async (req, res) => {
    await db.read();
    const { user1Id, user2Id } = req.params;
    const canonicalKey = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;

    let streakData = db.data.streaks[canonicalKey] || { currentStreak: 0, lastInteractionTimestamp: 0 };
    res.json(streakData);
});

app.post('/api/streaks/update', async (req, res) => {
    await db.read();
    const { user1Id, user2Id } = req.body;
    
    const canonicalKey = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    let currentStreakData = db.data.streaks[canonicalKey] || { currentStreak: 0, lastInteractionTimestamp: 0 };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; 

    const lastInteractionDate = new Date(currentStreakData.lastInteractionTimestamp);
    const today = new Date(now);

    if (now - currentStreakData.lastInteractionTimestamp > oneDay) {
        currentStreakData.currentStreak = 1; 
    } 
    else if (lastInteractionDate.toDateString() !== today.toDateString()) {
        currentStreakData.currentStreak++;
    }
    
    currentStreakData.lastInteractionTimestamp = now;

    db.data.streaks[canonicalKey] = currentStreakData;
    
    await db.write();
    res.json(currentStreakData);
});

// Attività (Notifiche)
app.get('/api/activities/:userId', async (req, res) => {
    await db.read();
    const { userId } = req.params;

    const relevantActivities = db.data.activities.filter(activity => 
        (activity.target && activity.target.userId === userId) || 
        (activity.type === 'follow' && activity.target && activity.target.id === userId)
    ).sort((a, b) => b.timestamp - a.timestamp); 

    const userMap = {};
    db.data.users.forEach(u => userMap[u.id] = u);

    const enrichedActivities = relevantActivities.map(activity => {
        const fromUser = userMap[activity.fromUser?.id];
        let target = activity.target;

        if (target && ['post', 'story', 'video'].includes(target.type)) {
            let mediaItem;
            if (target.type === 'post') {
                mediaItem = db.data.posts.find(p => p.id === target.id);
            } else if (target.type === 'story') {
                mediaItem = db.data.stories.find(s => s.id === target.id);
            } else if (target.type === 'video') {
                mediaItem = db.data.videos.find(v => v.id === target.id);
            }
            if (mediaItem) {
                target = { ...target, media: mediaItem.mediaPath }; 
            }
        }
        
        return {
            ...activity,
            fromUser: fromUser ? { id: fromUser.id, name: fromUser.name, avatar: fromUser.avatar } : activity.fromUser,
            target: target
        };
    });

    res.json(enrichedActivities);
});


// Avvia il server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});