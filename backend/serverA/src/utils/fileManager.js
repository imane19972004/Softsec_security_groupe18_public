import fs from "fs";
import path from "path";
import { AppError } from "./errors.js";

/**
 * Dossier racine de stockage des notes
 * Exemple : data/<userId>/
 */
const BASE_DATA_DIR = path.resolve("data");

/**
 * Sécurise et retourne le dossier d’un utilisateur
 */
export function getUserDirectory(userId) {
  const userDir = path.join(BASE_DATA_DIR, String(userId));

  if (!userDir.startsWith(BASE_DATA_DIR)) {
    throw new AppError("Invalid path", 400);
  }

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
  }

  return userDir;
}

/**
 * Écrit une note de manière sécurisée
 */
export function writeUserFile(userId, filename, content) {
  const userDir = getUserDirectory(userId);

  const safeFilename = path.basename(filename);
  const filePath = path.join(userDir, safeFilename);

  fs.writeFileSync(filePath, content, { encoding: "utf-8", flag: "w" });
}

/**
 * Lit une note utilisateur
 */
export function readUserFile(userId, filename) {
  const userDir = getUserDirectory(userId);
  const safeFilename = path.basename(filename);
  const filePath = path.join(userDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found", 404);
  }

  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Supprime une note utilisateur
 */
export function deleteUserFile(userId, filename) {
  const userDir = getUserDirectory(userId);
  const safeFilename = path.basename(filename);
  const filePath = path.join(userDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found", 404);
  }

  fs.unlinkSync(filePath);
}
