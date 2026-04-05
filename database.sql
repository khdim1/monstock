-- Création de la base de données (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS monstock;
USE monstock;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin','vendeur','caissier','gestionnaire') DEFAULT 'vendeur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table produits
CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    categorie VARCHAR(50),
    prixAchat DECIMAL(10,2) DEFAULT 0,
    prixVente DECIMAL(10,2) NOT NULL,
    quantite INT DEFAULT 0,
    minStock INT DEFAULT 10,
    codeBarre VARCHAR(50),
    supplier VARCHAR(100),
    unite VARCHAR(20) DEFAULT 'Pièce',
    description TEXT
);

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    adresse TEXT,
    creditLimit DECIMAL(10,2) DEFAULT 0,
    type ENUM('particulier','professionnel','entreprise') DEFAULT 'particulier',
    notes TEXT
);

-- Table ventes
CREATE TABLE IF NOT EXISTS ventes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME NOT NULL,
    client_id INT,
    client_name VARCHAR(100),
    montant DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    payment_method ENUM('cash','card','credit') DEFAULT 'cash',
    notes TEXT,
    paye BOOLEAN DEFAULT FALSE,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    date_paiement DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Table vente_details
CREATE TABLE IF NOT EXISTS vente_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vente_id INT NOT NULL,
    produit_id INT,
    designation VARCHAR(100),
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);

-- Table paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facture_id INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    method ENUM('cash','card','bank') DEFAULT 'cash',
    reference VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (facture_id) REFERENCES ventes(id) ON DELETE CASCADE
);

-- Table caisse
CREATE TABLE IF NOT EXISTS caisse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME NOT NULL,
    type ENUM('Entrée','Sortie','Ouverture') NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    details TEXT,
    category VARCHAR(50),
    responsable VARCHAR(50)
);

-- Table inventaires
CREATE TABLE IF NOT EXISTS inventaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    products JSON NOT NULL,
    theoreticalTotal INT NOT NULL,
    actualTotal INT NOT NULL,
    difference INT NOT NULL
);

-- Table store_settings
CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1,
    nom VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    adresse TEXT,
    currency VARCHAR(10) DEFAULT 'FCFA',
    language VARCHAR(5) DEFAULT 'fr'
);

-- Insérer un utilisateur admin par défaut (mot de passe = admin123)
-- Le mot de passe doit être haché avec bcrypt. Pour l'exemple, on utilise un hash déjà prêt.
-- Hash de "admin123" avec bcrypt (coût 10) : $2b$10$abcdefghijklmnopqrstuvwxyz...
-- Mais il est plus simple d'insérer via l'application plus tard.
-- Vous pouvez créer un premier utilisateur via l'interface ou via cette commande après avoir remplacé le hash.
-- Pour tester, connectez-vous avec le compte que vous avez créé manuellement.