const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques à la racine du projet
app.use(express.static(path.join(__dirname)));

// Connexion à la base de données MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'monstock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à MySQL:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

// Route pour la racine (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Routes pour les produits
app.get('/produits', (req, res) => {
    const sql = 'SELECT * FROM produits';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

app.post('/produits', (req, res) => {
    const { nom, quantite, prixAchat, prixVente, codeBarre } = req.body;
    const sql = 'INSERT INTO produits (nom, quantite, prixAchat, prixVente, codeBarre) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nom, quantite, prixAchat, prixVente, codeBarre], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création produit' });
        }
        res.json({ message: 'Produit ajouté avec succès', id: result.insertId });
    });
});

app.put('/produits/:id', (req, res) => {
    const { nom, quantite, prixAchat, prixVente, codeBarre } = req.body;
    const produitId = req.params.id;
    const sql = 'UPDATE produits SET nom = ?, quantite = ?, prixAchat = ?, prixVente = ?, codeBarre = ? WHERE id = ?';
    db.query(sql, [nom, quantite, prixAchat, prixVente, codeBarre, produitId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour produit' });
        }
        res.json({ message: 'Produit mis à jour avec succès' });
    });
});

app.delete('/produits/:id', (req, res) => {
    const produitId = req.params.id;
    const sql = 'DELETE FROM produits WHERE id = ?';
    db.query(sql, [produitId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression produit' });
        }
        res.json({ message: 'Produit supprimé avec succès' });
    });
});

// Routes pour les commandes fournisseurs
app.get('/commandes-fournisseurs', (req, res) => {
    const sql = 'SELECT * FROM commandes_fournisseurs';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération commandes' });
        }
        res.json(results);
    });
});

app.post('/commandes-fournisseurs', (req, res) => {
    const { fournisseur, produit, quantite, statut } = req.body;
    
    const allowedStatus = ['en_attente', 'livree', 'annulee'];
    if (!allowedStatus.includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }

    const sql = 'INSERT INTO commandes_fournisseurs (fournisseur, produit, quantite, statut) VALUES (?, ?, ?, ?)';
    db.query(sql, [fournisseur, produit, quantite, statut], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création commande' });
        }
        res.json({ message: 'Commande fournisseur ajoutée avec succès', id: result.insertId });
    });
});

app.put('/commandes-fournisseurs/:id', (req, res) => {
    const { fournisseur, produit, quantite, statut } = req.body;
    const commandeId = req.params.id;
    const sql = 'UPDATE commandes_fournisseurs SET fournisseur = ?, produit = ?, quantite = ?, statut = ? WHERE id = ?';
    db.query(sql, [fournisseur, produit, quantite, statut, commandeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour commande' });
        }
        res.json({ message: 'Commande fournisseur mise à jour avec succès' });
    });
});

app.delete('/commandes-fournisseurs/:id', (req, res) => {
    const commandeId = req.params.id;
    const sql = 'DELETE FROM commandes_fournisseurs WHERE id = ?';
    db.query(sql, [commandeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression commande' });
        }
        res.json({ message: 'Commande fournisseur supprimée avec succès' });
    });
});

// Routes pour les commandes clients
app.get('/commandes-clients', (req, res) => {
    const sql = 'SELECT * FROM commandes_clients';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération commandes clients' });
        }
        res.json(results);
    });
});

app.post('/commandes-clients', (req, res) => {
    const { client, produit, quantite, statut } = req.body;
    
    const allowedStatus = ['en_attente', 'livree', 'annulee'];
    if (!allowedStatus.includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }

    const sql = 'INSERT INTO commandes_clients (client, produit, quantite, statut) VALUES (?, ?, ?, ?)';
    db.query(sql, [client, produit, quantite, statut], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création commande client' });
        }
        res.json({ message: 'Commande client ajoutée avec succès', id: result.insertId });
    });
});

app.put('/commandes-clients/:id', (req, res) => {
    const { client, produit, quantite, statut } = req.body;
    const commandeId = req.params.id;
    const sql = 'UPDATE commandes_clients SET client = ?, produit = ?, quantite = ?, statut = ? WHERE id = ?';
    db.query(sql, [client, produit, quantite, statut, commandeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour commande client' });
        }
        res.json({ message: 'Commande client mise à jour avec succès' });
    });
});

app.delete('/commandes-clients/:id', (req, res) => {
    const commandeId = req.params.id;
    const sql = 'DELETE FROM commandes_clients WHERE id = ?';
    db.query(sql, [commandeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression commande client' });
        }
        res.json({ message: 'Commande client supprimée avec succès' });
    });
});

// Routes pour les stocks
app.get('/stocks', (req, res) => {
    const sql = 'SELECT * FROM stocks';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération stocks' });
        }
        res.json(results);
    });
});

app.post('/stocks', (req, res) => {
    const { produit, quantite, site_magasin } = req.body;
    const sql = 'INSERT INTO stocks (produit, quantite, site_magasin) VALUES (?, ?, ?)';
    db.query(sql, [produit, quantite, site_magasin], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur ajout stock' });
        }
        res.json({ message: 'Stock ajouté avec succès', id: result.insertId });
    });
});

app.put('/stocks/:id', (req, res) => {
    const { produit, quantite, site_magasin } = req.body;
    const stockId = req.params.id;
    const sql = 'UPDATE stocks SET produit = ?, quantite = ?, site_magasin = ? WHERE id = ?';
    db.query(sql, [produit, quantite, site_magasin, stockId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour stock' });
        }
        res.json({ message: 'Stock mis à jour avec succès' });
    });
});

app.delete('/stocks/:id', (req, res) => {
    const stockId = req.params.id;
    const sql = 'DELETE FROM stocks WHERE id = ?';
    db.query(sql, [stockId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression stock' });
        }
        res.json({ message: 'Stock supprimé avec succès' });
    });
});

// Routes pour les sites/magasins
app.get('/sites-magasins', (req, res) => {
    const sql = 'SELECT * FROM sites_magasins';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération sites' });
        }
        res.json(results);
    });
});

app.post('/sites-magasins', (req, res) => {
    const { nom, adresse, ville, pays } = req.body;
    const sql = 'INSERT INTO sites_magasins (nom, adresse, ville, pays) VALUES (?, ?, ?, ?)';
    db.query(sql, [nom, adresse, ville, pays], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur ajout site' });
        }
        res.json({ message: 'Site/Magasin ajouté avec succès', id: result.insertId });
    });
});

app.put('/sites-magasins/:id', (req, res) => {
    const { nom, adresse, ville, pays } = req.body;
    const siteId = req.params.id;
    const sql = 'UPDATE sites_magasins SET nom = ?, adresse = ?, ville = ?, pays = ? WHERE id = ?';
    db.query(sql, [nom, adresse, ville, pays, siteId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour site' });
        }
        res.json({ message: 'Site/Magasin mis à jour avec succès' });
    });
});

app.delete('/sites-magasins/:id', (req, res) => {
    const siteId = req.params.id;
    const sql = 'DELETE FROM sites_magasins WHERE id = ?';
    db.query(sql, [siteId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression site' });
        }
        res.json({ message: 'Site/Magasin supprimé avec succès' });
    });
});

// Routes pour les listes déroulantes
app.get('/produits/list', (req, res) => {
    const sql = 'SELECT id, nom FROM produits';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération produits' });
        }
        res.json(results);
    });
});

app.get('/fournisseurs/list', (req, res) => {
    const sql = 'SELECT DISTINCT fournisseur FROM commandes_fournisseurs';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération fournisseurs' });
        }
        res.json(results.map(r => r.fournisseur));
    });
});

app.get('/sites-magasins/list', (req, res) => {
    const sql = 'SELECT id, nom FROM sites_magasins';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération sites' });
        }
        res.json(results);
    });
});

// Ajoutez ce gestionnaire d'erreurs immédiatement après db.connect
db.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to database...');
    db.connect();
  } else {
    throw err;
  }
});

// Corrigez la route /ventes
app.post('/ventes', (req, res) => {
  const { montant } = req.body;
  const date = new Date().toISOString().split('T')[0];

  // Vérifiez d'abord la connexion
  if (db.state !== 'authenticated') {
    return res.status(500).json({ error: 'Database connection lost' });
  }

  // Requête avec vérification de la structure de la table
  const sqlVente = `INSERT INTO ventes (date, montant) VALUES (?, ?)`;
  
  db.query(sqlVente, [date, montant], (err, result) => {
    if (err) {
      console.error('SQL Error details:', err);
      return res.status(500).json({ 
        error: 'Erreur création vente',
        details: err.message,
        sql: err.sql
      });
    }

    // Vérification supplémentaire du résultat
    if (!result || !result.insertId) {
      console.error('Unexpected query result:', result);
      return res.status(500).json({ error: 'Insertion failed unexpectedly' });
    }

    res.json({ 
      message: 'Vente enregistrée avec succès',
      venteId: result.insertId 
    });
  });
});
// Gestion du solde
app.post('/api/solde', (req, res) => {
    const { date, montant } = req.body;
    const sql = `INSERT INTO solde (date, montant) 
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE 
                montant = montant + VALUES(montant)`;
    
    db.query(sql, [date, montant], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour solde' });
        }
        res.json({ message: 'Solde mis à jour', id: result.insertId });
    });
});

app.get('/api/solde', (req, res) => {
    const sql = `SELECT 
                    date,
                    total_ventes,
                    versements,
                    (total_ventes - versements) AS solde
                FROM solde
                ORDER BY date DESC`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération solde' });
        }
        res.json(results);
    });
});

// Gestion des clients
app.post('/clients', (req, res) => {
    const { nom, adresse, telephone, email } = req.body;

    if (!nom || !adresse || !telephone || !email) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const query = `INSERT INTO clients (nom, adresse, telephone, email) VALUES (?, ?, ?, ?)`;
    db.query(query, [nom, adresse, telephone, email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création client' });
        }
        res.status(201).json({ message: 'Client créé avec succès', clientId: result.insertId });
    });
});

app.get('/clients', (req, res) => {
    const query = 'SELECT * FROM clients';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération clients' });
        }
        res.json(results);
    });
});

// Gestion des factures
app.post('/factures', (req, res) => {
    const { client_id, montant_total, echeance } = req.body;
    
    if (!client_id || !montant_total || !echeance) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const query = `INSERT INTO factures (client_id, montant_total, echeance) VALUES (?, ?, ?)`;
    db.query(query, [client_id, montant_total, echeance], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création facture' });
        }
        res.status(201).json({ message: 'Facture créée avec succès', factureId: result.insertId });
    });
});

app.get('/factures', (req, res) => {
    const query = 'SELECT * FROM factures';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération factures' });
        }
        
        const factures = results.map(facture => ({
            id: facture.id,
            client: facture.client_id,
            montantTotal: facture.montant_total,
            montantPaye: facture.montant_paye || 0,
            reste: facture.montant_total - (facture.montant_paye || 0),
            statut: facture.statut
        }));

        res.json(factures);
    });
});

// Gestion des paiements
app.post('/paiements', (req, res) => {
    const { facture_id, montant } = req.body;

    db.beginTransaction((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur transaction' });
        }

        const insertQuery = `INSERT INTO paiements (facture_id, montant) VALUES (?, ?)`;
        db.query(insertQuery, [facture_id, montant], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: 'Erreur création paiement' });
                });
            }

            const updateQuery = `UPDATE factures SET montant_paye = montant_paye + ? WHERE id = ?`;
            db.query(updateQuery, [montant, facture_id], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error(err);
                        res.status(500).json({ error: 'Erreur mise à jour facture' });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error(err);
                            res.status(500).json({ error: 'Erreur commit transaction' });
                        });
                    }
                    res.status(200).json({ message: 'Paiement enregistré avec succès.' });
                });
            });
        });
    });
});

// Gestion des fournisseurs
app.get('/fournisseurs', (req, res) => {
    const sql = 'SELECT * FROM fournisseurs';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération fournisseurs' });
        }
        res.json(results);
    });
});

app.post('/fournisseurs', (req, res) => {
    const { nom, adresse, telephone, email } = req.body;
    const sql = 'INSERT INTO fournisseurs (nom, adresse, telephone, email) VALUES (?, ?, ?, ?)';
    db.query(sql, [nom, adresse, telephone, email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création fournisseur' });
        }
        res.json({ message: 'Fournisseur ajouté avec succès', id: result.insertId });
    });
});

app.put('/fournisseurs/:id', (req, res) => {
    const { nom, adresse, telephone, email } = req.body;
    const fournisseurId = req.params.id;
    const sql = 'UPDATE fournisseurs SET nom = ?, adresse = ?, telephone = ?, email = ? WHERE id = ?';
    db.query(sql, [nom, adresse, telephone, email, fournisseurId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur mise à jour fournisseur' });
        }
        res.json({ message: 'Fournisseur mis à jour avec succès' });
    });
});

app.delete('/fournisseurs/:id', (req, res) => {
    const fournisseurId = req.params.id;
    const sql = 'DELETE FROM fournisseurs WHERE id = ?';
    db.query(sql, [fournisseurId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur suppression fournisseur' });
        }
        res.json({ message: 'Fournisseur supprimé avec succès' });
    });
});

// Gestion des dépenses
app.get('/depenses', (req, res) => {
    const sql = 'SELECT * FROM depenses';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération dépenses' });
        }
        res.json(results);
    });
});

app.post('/depenses', (req, res) => {
    const { type, montant, date_depense, description, fournisseur_id } = req.body;
    const sql = 'INSERT INTO depenses (type, montant, date_depense, description, fournisseur_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [type, montant, date_depense, description, fournisseur_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur création dépense' });
        }
        res.json({ message: 'Dépense ajoutée avec succès', id: result.insertId });
    });
});

// Gestion des employés
app.get('/employes', (req, res) => {
    const sql = 'SELECT * FROM employes';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération employés' });
        }
        res.json(results);
    });
});

// Gestion de la caisse
app.post('/api/caisse', (req, res) => {
    const { type, montant, details } = req.body;
    const sql = 'INSERT INTO caisse (date, type, montant, details) VALUES (NOW(), ?, ?, ?)';
    
    db.query(sql, [type, montant, details], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur transaction caisse' });
        }
        res.json({ message: 'Transaction de caisse ajoutée avec succès', id: result.insertId });
    });
});

app.get('/api/caisse', (req, res) => {
    const sql = 'SELECT SUM(montant) AS total FROM caisse';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération solde caisse' });
        }
        res.json({ total: results[0].total || 0 });
    });
});

// Historique
app.get('/historique', (req, res) => {
    const sql = 'SELECT * FROM historique ORDER BY date DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur récupération historique' });
        }
        res.json(results);
    });
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue sur le serveur' });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});