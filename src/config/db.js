const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Simple promise-based queue for thread-safe sequential file writes
class Mutex {
  constructor() {
    this.queue = Promise.resolve();
  }

  lock(fn) {
    const next = this.queue.then(() => fn());
    this.queue = next.catch(() => {});
    return next;
  }
}

const locks = {};
function getLock(collection) {
  if (!locks[collection]) {
    locks[collection] = new Mutex();
  }
  return locks[collection];
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const COLLECTIONS = [
  'users',
  'employees',
  'software',
  'licenses',
  'vendors',
  'assignments',
  'renewals',
  'notifications',
  'auditLogs',
  'settings'
];

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// Initialize empty files if they don't exist
COLLECTIONS.forEach(col => {
  const filePath = getFilePath(col);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(col === 'settings' ? {} : [], null, 2), 'utf8');
  }
});

const db = {
  getFilePath,

  async read(collection) {
    const filePath = getFilePath(collection);
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content || (collection === 'settings' ? '{}' : '[]'));
    } catch (err) {
      console.error(`Error reading ${collection}.json:`, err.message);
      return collection === 'settings' ? {} : [];
    }
  },

  async write(collection, data) {
    const lock = getLock(collection);
    return lock.lock(async () => {
      const filePath = getFilePath(collection);
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      try {
        const json = JSON.stringify(data, null, 2);
        await fs.promises.writeFile(tempPath, json, 'utf8');
        await fs.promises.rename(tempPath, filePath);
        return data;
      } catch (err) {
        if (fs.existsSync(tempPath)) {
          try { await fs.promises.unlink(tempPath); } catch (_) {}
        }
        console.error(`Error writing ${collection}.json:`, err.message);
        throw err;
      }
    });
  },

  async find(collection, queryFn = () => true) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) return [];
    return items.filter(queryFn);
  },

  async findOne(collection, queryFn) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) return null;
    return items.find(queryFn) || null;
  },

  async findById(collection, id, idField = null) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) return null;
    return items.find(item => {
      if (idField && item[idField] !== undefined) {
        return String(item[idField]) === String(id);
      }
      return (
        String(item.id) === String(id) ||
        String(item.softwareId) === String(id) ||
        String(item.licenseId) === String(id) ||
        String(item.employeeId) === String(id) ||
        String(item.vendorId) === String(id) ||
        String(item.assignmentId) === String(id) ||
        String(item.renewalId) === String(id) ||
        String(item.notificationId) === String(id)
      );
    }) || null;
  },

  async insert(collection, record) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${collection} is not an array.`);
    }
    items.unshift(record); // Add to top for reverse-chronological default order
    await this.write(collection, items);
    return record;
  },

  async update(collection, id, updates, idField = null) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${collection} is not an array.`);
    }
    const index = items.findIndex(item => {
      if (idField && item[idField] !== undefined) {
        return String(item[idField]) === String(id);
      }
      return (
        String(item.id) === String(id) ||
        String(item.softwareId) === String(id) ||
        String(item.licenseId) === String(id) ||
        String(item.employeeId) === String(id) ||
        String(item.vendorId) === String(id) ||
        String(item.assignmentId) === String(id) ||
        String(item.renewalId) === String(id) ||
        String(item.notificationId) === String(id)
      );
    });

    if (index === -1) {
      return null;
    }

    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(collection, items);
    return items[index];
  },

  async delete(collection, id, idField = null) {
    const items = await this.read(collection);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${collection} is not an array.`);
    }
    const index = items.findIndex(item => {
      if (idField && item[idField] !== undefined) {
        return String(item[idField]) === String(id);
      }
      return (
        String(item.id) === String(id) ||
        String(item.softwareId) === String(id) ||
        String(item.licenseId) === String(id) ||
        String(item.employeeId) === String(id) ||
        String(item.vendorId) === String(id) ||
        String(item.assignmentId) === String(id) ||
        String(item.renewalId) === String(id) ||
        String(item.notificationId) === String(id)
      );
    });

    if (index === -1) {
      return false;
    }

    const removed = items.splice(index, 1);
    await this.write(collection, items);
    return removed[0];
  },

  async exportAll() {
    const exportData = {};
    for (const col of COLLECTIONS) {
      exportData[col] = await this.read(col);
    }
    return exportData;
  },

  async importAll(data) {
    for (const col of COLLECTIONS) {
      if (data[col] !== undefined) {
        await this.write(col, data[col]);
      }
    }
    return true;
  }
};

module.exports = db;
