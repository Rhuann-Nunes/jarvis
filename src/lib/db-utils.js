"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = exports.SectionService = exports.ProjectService = exports.TaskService = void 0;
var uuid_1 = require("uuid");
// Cache for recurring task occurrences
var occurrencesCache = {};
// Clear cache when tasks are modified
var clearOccurrencesCache = function () {
    Object.keys(occurrencesCache).forEach(function (key) {
        delete occurrencesCache[key];
    });
};
// Task operations
exports.TaskService = {
    getAllTasks: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.task.findMany({
                    where: { userId: userId },
                    orderBy: { updatedAt: 'desc' },
                })];
        });
    }); },
    getTaskById: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.task.findUnique({
                    where: { id: taskId },
                })];
        });
    }); },
    // Get tasks due today - exclude completed
    getTasksDueToday: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var today, tomorrow;
        return __generator(this, function (_a) {
            today = new Date();
            today.setHours(0, 0, 0, 0);
            tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return [2 /*return*/, prisma_1.prisma.task.findMany({
                    where: {
                        userId: userId,
                        completed: false,
                        dueDate: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                    orderBy: { dueDate: 'asc' },
                })];
        });
    }); },
    // Get tasks due this week - exclude completed
    getTasksDueThisWeek: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var today, endOfWeek;
        return __generator(this, function (_a) {
            today = new Date();
            today.setHours(0, 0, 0, 0);
            endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            endOfWeek.setHours(23, 59, 59, 999);
            return [2 /*return*/, prisma_1.prisma.task.findMany({
                    where: {
                        userId: userId,
                        completed: false,
                        dueDate: {
                            gte: today,
                            lte: endOfWeek,
                        },
                    },
                    orderBy: { dueDate: 'asc' },
                })];
        });
    }); },
    // Get all incomplete tasks
    getIncompleteTasks: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.task.findMany({
                    where: {
                        userId: userId,
                        completed: false,
                    },
                    orderBy: { updatedAt: 'desc' },
                })];
        });
    }); },
    // Get all completed tasks
    getCompletedTasks: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.task.findMany({
                    where: {
                        userId: userId,
                        completed: true,
                    },
                    orderBy: { completedAt: 'desc' },
                })];
        });
    }); },
    createTask: function (taskData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            clearOccurrencesCache();
            return [2 /*return*/, prisma_1.prisma.task.create({
                    data: __assign(__assign({}, taskData), { id: (0, uuid_1.v4)() })
                })];
        });
    }); },
    updateTask: function (taskId, taskData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            clearOccurrencesCache();
            return [2 /*return*/, prisma_1.prisma.task.update({
                    where: { id: taskId },
                    data: taskData,
                })];
        });
    }); },
    deleteTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearOccurrencesCache();
                    return [4 /*yield*/, prisma_1.prisma.task.delete({
                            where: { id: taskId },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    completeTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            clearOccurrencesCache();
            return [2 /*return*/, prisma_1.prisma.task.update({
                    where: { id: taskId },
                    data: {
                        completed: true,
                        completedAt: new Date()
                    },
                })];
        });
    }); },
    uncompleteTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            clearOccurrencesCache();
            return [2 /*return*/, prisma_1.prisma.task.update({
                    where: { id: taskId },
                    data: {
                        completed: false,
                        completedAt: null
                    },
                })];
        });
    }); },
};
// Project operations
exports.ProjectService = {
    getAllProjects: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.project.findMany({
                    where: { userId: userId },
                    include: { sections: true },
                    orderBy: { name: 'asc' },
                })];
        });
    }); },
    getProjectById: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.project.findUnique({
                    where: { id: projectId },
                    include: { sections: true },
                })];
        });
    }); },
    createProject: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.project.create({
                    data: __assign(__assign({}, data), { id: (0, uuid_1.v4)() })
                })];
        });
    }); },
    updateProject: function (projectId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.project.update({
                    where: { id: projectId },
                    data: data,
                })];
        });
    }); },
    deleteProject: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.project.delete({
                        where: { id: projectId },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    // Initialize default projects for a new user
    initializeDefaultProjects: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var homeProject, workProject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.project.create({
                        data: {
                            id: (0, uuid_1.v4)(),
                            name: 'Casa',
                            color: '#4CAF50', // Green
                            userId: userId,
                        }
                    })];
                case 1:
                    homeProject = _a.sent();
                    return [4 /*yield*/, prisma_1.prisma.project.create({
                            data: {
                                id: (0, uuid_1.v4)(),
                                name: 'Trabalho',
                                color: '#2196F3', // Blue
                                userId: userId,
                            }
                        })];
                case 2:
                    workProject = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
};
// Section operations
exports.SectionService = {
    getSectionsByProjectId: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.section.findMany({
                    where: { projectId: projectId },
                    orderBy: { name: 'asc' },
                })];
        });
    }); },
    createSection: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.section.create({
                    data: __assign(__assign({}, data), { id: (0, uuid_1.v4)() })
                })];
        });
    }); },
    updateSection: function (sectionId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.section.update({
                    where: { id: sectionId },
                    data: data,
                })];
        });
    }); },
    deleteSection: function (sectionId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.section.delete({
                        where: { id: sectionId },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
};
// User operations
exports.UserService = {
    getUserByEmail: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.user.findUnique({
                    where: { email: email },
                })];
        });
    }); },
    createUser: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.user.create({
                        data: __assign(__assign({}, data), { id: (0, uuid_1.v4)() })
                    })];
                case 1:
                    user = _a.sent();
                    // Initialize default projects for the new user
                    return [4 /*yield*/, exports.ProjectService.initializeDefaultProjects(user.id)];
                case 2:
                    // Initialize default projects for the new user
                    _a.sent();
                    return [2 /*return*/, user];
            }
        });
    }); },
    updateUser: function (userId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: data,
                })];
        });
    }); },
};
