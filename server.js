const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_tres_long_et_aleatoire';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connexion à la base de données MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'monstock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promiseDb = db.promise();

// Vérification de la connexion
db.getConnection((err, connection) => {
    if (err) {
        console.error('Erreur de connexion à MySQL:', err);
        process.exit(1);
    }
    console.log('Connecté à la base de données MySQL');
    connection.release();
});

// Middleware d'authentification JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
}

// Routes publiques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }
    try {
        const [rows] = await promiseDb.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ---------- ROUTES PRODUITS ----------
app.get('/api/produits', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query('SELECT * FROM produits ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération produits' });
    }
});

app.post('/api/produits', authenticateToken, async (req, res) => {
    const { nom, categorie, prixAchat, prixVente, quantite, minStock, codeBarre, supplier, unite, description } = req.body;
    if (!nom || prixVente === undefined) {
        return res.status(400).json({ error: 'Nom et prix de vente requis' });
    }
    try {
        const [result] = await promiseDb.query(
            `INSERT INTO produits (nom, categorie, prixAchat, prixVente, quantite, minStock, codeBarre, supplier, unite, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom, categorie || null, prixAchat || 0, prixVente, quantite || 0, minStock || 10, codeBarre || null, supplier || null, unite || 'Pièce', description || null]
        );
        res.status(201).json({ message: 'Produit ajouté', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création produit' });
    }
});

app.put('/api/produits/:id', authenticateToken, async (req, res) => {
    const { nom, categorie, prixAchat, prixVente, quantite, minStock, codeBarre, supplier, unite, description } = req.body;
    const id = req.params.id;
    try {
        await promiseDb.query(
            `UPDATE produits SET nom=?, categorie=?, prixAchat=?, prixVente=?, quantite=?, minStock=?, codeBarre=?, supplier=?, unite=?, description=?
             WHERE id=?`,
            [nom, categorie, prixAchat, prixVente, quantite, minStock, codeBarre, supplier, unite, description, id]
        );
        res.json({ message: 'Produit mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise à jour' });
    }
});

app.delete('/api/produits/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        await promiseDb.query('DELETE FROM produits WHERE id=?', [id]);
        res.json({ message: 'Produit supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ---------- ROUTES CLIENTS ----------
app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query('SELECT * FROM clients ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération clients' });
    }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
    const { nom, telephone, email, adresse, creditLimit, type, notes } = req.body;
    if (!nom || !telephone) return res.status(400).json({ error: 'Nom et téléphone requis' });
    try {
        const [result] = await promiseDb.query(
            `INSERT INTO clients (nom, telephone, email, adresse, creditLimit, type, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, telephone, email || null, adresse || null, creditLimit || 0, type || 'particulier', notes || null]
        );
        res.status(201).json({ message: 'Client ajouté', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création client' });
    }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    const { nom, telephone, email, adresse, creditLimit, type, notes } = req.body;
    const id = req.params.id;
    try {
        await promiseDb.query(
            `UPDATE clients SET nom=?, telephone=?, email=?, adresse=?, creditLimit=?, type=?, notes=? WHERE id=?`,
            [nom, telephone, email, adresse, creditLimit, type, notes, id]
        );
        res.json({ message: 'Client mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise à jour' });
    }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        await promiseDb.query('DELETE FROM clients WHERE id=?', [id]);
        res.json({ message: 'Client supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ---------- ROUTES VENTES ----------
app.get('/api/ventes', authenticateToken, async (req, res) => {
    try {
        const [ventes] = await promiseDb.query('SELECT * FROM ventes ORDER BY date DESC');
        for (let vente of ventes) {
            const [details] = await promiseDb.query('SELECT * FROM vente_details WHERE vente_id = ?', [vente.id]);
            vente.details = details;
        }
        res.json(ventes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération ventes' });
    }
});

app.post('/api/ventes', authenticateToken, async (req, res) => {
    const { client_id, client_name, montant, discount, payment_method, notes, details } = req.body;
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const connection = await promiseDb.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            `INSERT INTO ventes (date, client_id, client_name, montant, discount, payment_method, notes, paye, amount_paid, date_paiement)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [date, client_id || null, client_name || null, montant, discount || 0, payment_method || 'cash', notes || null, payment_method !== 'credit', payment_method !== 'credit' ? montant : 0, payment_method !== 'credit' ? date : null]
        );
        const venteId = result.insertId;
        if (details && details.length) {
            for (let item of details) {
                await connection.query(
                    `INSERT INTO vente_details (vente_id, produit_id, designation, quantite, prix_unitaire)
                     VALUES (?, ?, ?, ?, ?)`,
                    [venteId, item.produit_id || null, item.designation || null, item.quantite, item.prix_unitaire]
                );
                if (item.produit_id) {
                    await connection.query('UPDATE produits SET quantite = quantite - ? WHERE id = ?', [item.quantite, item.produit_id]);
                }
            }
        }
        await connection.commit();
        res.status(201).json({ message: 'Vente enregistrée', id: venteId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Erreur création vente' });
    } finally {
        connection.release();
    }
});

app.delete('/api/ventes/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        await promiseDb.query('DELETE FROM ventes WHERE id=?', [id]);
        res.json({ message: 'Vente supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ---------- ROUTES FACTURES (basées sur ventes) ----------
app.get('/api/factures', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query(`
            SELECT v.*, c.nom as client_nom 
            FROM ventes v
            LEFT JOIN clients c ON v.client_id = c.id
            ORDER BY v.date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération factures' });
    }
});

// ---------- ROUTES PAIEMENTS ----------
app.post('/api/paiements', authenticateToken, async (req, res) => {
    const { facture_id, montant, date, method, reference, notes } = req.body;
    const connection = await promiseDb.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            `INSERT INTO paiements (facture_id, montant, date, method, reference, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [facture_id, montant, date, method, reference || null, notes || null]
        );
        await connection.query(
            `UPDATE ventes SET amount_paid = amount_paid + ?, paye = (amount_paid + ? >= montant) WHERE id = ?`,
            [montant, montant, facture_id]
        );
        await connection.commit();
        res.status(201).json({ message: 'Paiement enregistré', id: result.insertId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Erreur enregistrement paiement' });
    } finally {
        connection.release();
    }
});

// ---------- ROUTES CAISSE ----------
app.get('/api/caisse', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query('SELECT * FROM caisse ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération caisse' });
    }
});

app.post('/api/caisse', authenticateToken, async (req, res) => {
    const { type, montant, description, details, category } = req.body;
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
        const [result] = await promiseDb.query(
            `INSERT INTO caisse (date, type, montant, description, details, category, responsable)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [date, type, montant, description, details || null, category || null, req.user.username]
        );
        res.status(201).json({ message: 'Opération enregistrée', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur enregistrement' });
    }
});

// ---------- ROUTES INVENTAIRE ----------
app.get('/api/inventaires', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query('SELECT * FROM inventaires ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération inventaires' });
    }
});

app.post('/api/inventaires', authenticateToken, async (req, res) => {
    const { date, products, theoreticalTotal, actualTotal, difference } = req.body;
    try {
        const [result] = await promiseDb.query(
            `INSERT INTO inventaires (date, products, theoreticalTotal, actualTotal, difference)
             VALUES (?, ?, ?, ?, ?)`,
            [date, JSON.stringify(products), theoreticalTotal, actualTotal, difference]
        );
        res.status(201).json({ message: 'Inventaire enregistré', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur enregistrement inventaire' });
    }
});

// ---------- ROUTES UTILISATEURS (admin only) ----------
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    try {
        const [rows] = await promiseDb.query('SELECT id, username, fullName, email, role, created_at FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération utilisateurs' });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    const { username, password, fullName, email, role } = req.body;
    if (!username || !password || !fullName) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const [result] = await promiseDb.query(
            `INSERT INTO users (username, password, fullName, email, role) VALUES (?, ?, ?, ?, ?)`,
            [username, hashedPassword, fullName, email || null, role || 'vendeur']
        );
        res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création utilisateur' });
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    const id = req.params.id;
    if (id == req.user.id) return res.status(400).json({ error: 'Impossible de supprimer son propre compte' });
    try {
        await promiseDb.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ---------- ROUTES PARAMÈTRES MAGASIN ----------
app.get('/api/settings/store', authenticateToken, async (req, res) => {
    try {
        const [rows] = await promiseDb.query('SELECT * FROM store_settings WHERE id = 1');
        if (rows.length) res.json(rows[0]);
        else res.json({ nom: 'Mon Magasin', telephone: '', email: '', adresse: '', currency: 'FCFA', language: 'fr' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération paramètres' });
    }
});

app.post('/api/settings/store', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    const { nom, telephone, email, adresse, currency, language } = req.body;
    try {
        await promiseDb.query(
            `REPLACE INTO store_settings (id, nom, telephone, email, adresse, currency, language) VALUES (1, ?, ?, ?, ?, ?, ?)`,
            [nom, telephone, email, adresse, currency, language]
        );
        res.json({ message: 'Paramètres enregistrés' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur enregistrement' });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});