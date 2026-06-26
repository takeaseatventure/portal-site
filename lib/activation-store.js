'use strict';

const fs = require('fs');
const path = require('path');

/**
 * File-based activation store.
 * Tracks which machineIds have activated each license key.
 * 
 * Data format (JSON file):
 * { "LIC-xxx-yyy": { "machineId1": "2026-06-25T...", "machineId2": "..." } }
 * 
 * This is intentionally simple — swap for Redis/Postgres in production.
 */

class ActivationStore {
  /**
   * @param {string} dataFile - Path to the JSON data file
   */
  constructor(dataFile) {
    this.dataFile = dataFile;
    this._cache = null;
  }

  _load() {
    if (this._cache) return this._cache;
    try {
      const raw = fs.readFileSync(this.dataFile, 'utf8');
      this._cache = JSON.parse(raw);
    } catch {
      this._cache = {};
    }
    return this._cache;
  }

  _save() {
    const dir = path.dirname(this.dataFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dataFile, JSON.stringify(this._cache, null, 2), 'utf8');
  }

  /**
   * Get all activations for a key.
   * @param {string} key
   * @returns {Object} Map of machineId -> activation timestamp
   */
  getActivations(key) {
    const data = this._load();
    return data[key] || {};
  }

  /**
   * Count activations for a key.
   * @param {string} key
   * @returns {number}
   */
  countActivations(key) {
    return Object.keys(this.getActivations(key)).length;
  }

  /**
   * Check if a machine has already activated this key.
   * @param {string} key
   * @param {string} machineId
   * @returns {boolean}
   */
  isActivated(key, machineId) {
    const activations = this.getActivations(key);
    return Object.prototype.hasOwnProperty.call(activations, machineId);
  }

  /**
   * Activate a key on a machine. Returns whether the activation was new.
   * @param {string} key
   * @param {string} machineId
   * @param {number} limit - Max activations allowed
   * @returns {{ activated: boolean, alreadyActive: boolean, count: number, limit: number }}
   */
  activate(key, machineId, limit) {
    const data = this._load();
    if (!data[key]) data[key] = {};

    if (data[key][machineId]) {
      return {
        activated: false,
        alreadyActive: true,
        count: Object.keys(data[key]).length,
        limit,
      };
    }

    const count = Object.keys(data[key]).length;
    if (count >= limit) {
      return { activated: false, alreadyActive: false, count, limit };
    }

    data[key][machineId] = new Date().toISOString();
    this._save();
    return { activated: true, alreadyActive: false, count: count + 1, limit };
  }

  /**
   * Deactivate a key on a machine (for transfers/support).
   * @param {string} key
   * @param {string} machineId
   */
  deactivate(key, machineId) {
    const data = this._load();
    if (data[key]) {
      delete data[key][machineId];
      this._save();
    }
  }

  /**
   * Clear all activations for a key (full reset).
   * @param {string} key
   */
  reset(key) {
    const data = this._load();
    delete data[key];
    this._save();
  }
}

module.exports = { ActivationStore };
