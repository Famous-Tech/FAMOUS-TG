# Utilisez une image de base avec Node.js
FROM node:14

# Définissez le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copiez les fichiers package.json et package-lock.json
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez le reste des fichiers de l'application
COPY . .

# Exposez le port sur lequel l'application va tourner
EXPOSE 8000

# Commande pour démarrer l'application
CMD ["node", "bot.js"]
