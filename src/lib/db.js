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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionService = exports.ProjectService = exports.TaskService = void 0;
var db_utils_1 = require("./db-utils");
// Este arquivo será substituído pelo db-utils.ts que usa Supabase diretamente
// Apenas para compatibilidade durante a migração - 
// este arquivo será completamente substituído pelo db-utils.ts no futuro
// Todas as chamadas de serviço redirecionam para os novos serviços do Prisma
// Obtém o ID do usuário da sessão
var getUserId = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, session, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch('/api/auth/session')];
            case 1:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                session = _b.sent();
                if ((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id) {
                    return [2 /*return*/, session.user.id];
                }
                return [2 /*return*/, null];
            case 3:
                error_1 = _b.sent();
                console.error('Error getting user ID:', error_1);
                return [2 /*return*/, null];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Task operations
exports.TaskService = {
    getAllTasks: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.TaskService.getAllTasks(userId)];
            }
        });
    }); },
    getTasksByProject: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        var userId, tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId || !projectId)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, db_utils_1.TaskService.getTasksByProject(userId, projectId)];
                case 2:
                    tasks = _a.sent();
                    // Converter campos null para undefined para compatibilidade de tipo
                    return [2 /*return*/, tasks.map(function (task) { return (__assign(__assign({}, task), { description: task.description || undefined, completedAt: task.completedAt || undefined, dueDate: task.dueDate || undefined, projectId: task.projectId || undefined, sectionId: task.sectionId || undefined, recurrenceType: task.recurrenceType || undefined, recurrenceInterval: task.recurrenceInterval || undefined })); })];
            }
        });
    }); },
    getTasksBySection: function (sectionId) { return __awaiter(void 0, void 0, void 0, function () {
        var userId, tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId || !sectionId)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, db_utils_1.TaskService.getTasksBySection(userId, sectionId)];
                case 2:
                    tasks = _a.sent();
                    // Converter campos null para undefined para compatibilidade de tipo
                    return [2 /*return*/, tasks.map(function (task) { return (__assign(__assign({}, task), { description: task.description || undefined, completedAt: task.completedAt || undefined, dueDate: task.dueDate || undefined, projectId: task.projectId || undefined, sectionId: task.sectionId || undefined, recurrenceType: task.recurrenceType || undefined, recurrenceInterval: task.recurrenceInterval || undefined })); })];
            }
        });
    }); },
    getTaskById: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        var task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.TaskService.getTaskById(taskId)];
                case 1:
                    task = _a.sent();
                    return [2 /*return*/, task || undefined];
            }
        });
    }); },
    getTasksDueToday: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.TaskService.getTasksDueToday(userId)];
            }
        });
    }); },
    getTasksDueThisWeek: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.TaskService.getTasksDueThisWeek(userId)];
            }
        });
    }); },
    getIncompleteTasks: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.TaskService.getIncompleteTasks(userId)];
            }
        });
    }); },
    getCompletedTasks: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.TaskService.getCompletedTasks(userId)];
            }
        });
    }); },
    // Método para obter tarefas futuras em um período específico
    getUpcomingTasks: function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (days, startDate, endDate) {
            var userId, start, end, tasks;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getUserId()];
                    case 1:
                        userId = _a.sent();
                        if (!userId)
                            return [2 /*return*/, []];
                        start = startDate || new Date();
                        end = endDate || new Date(start);
                        if (!endDate && days > 0) {
                            end.setDate(end.getDate() + days);
                        }
                        return [4 /*yield*/, db_utils_1.TaskService.getUpcomingTasks(userId, start, end)];
                    case 2:
                        tasks = _a.sent();
                        // Converter campos null para undefined para compatibilidade de tipo
                        return [2 /*return*/, tasks.map(function (task) { return (__assign(__assign({}, task), { description: task.description || undefined, completedAt: task.completedAt || undefined, dueDate: task.dueDate || undefined, projectId: task.projectId || undefined, sectionId: task.sectionId || undefined, recurrenceType: task.recurrenceType || undefined, recurrenceInterval: task.recurrenceInterval || undefined })); })];
                }
            });
        });
    },
    createTask: function (task) { return __awaiter(void 0, void 0, void 0, function () {
        var userId, taskWithUserId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId) {
                        throw new Error('Usuário não autenticado');
                    }
                    taskWithUserId = __assign(__assign({}, task), { userId: userId });
                    // Tipando de forma mais específica
                    return [2 /*return*/, db_utils_1.TaskService.createTask(taskWithUserId)];
            }
        });
    }); },
    updateTask: function (taskId, updates) { return __awaiter(void 0, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.TaskService.updateTask(taskId, updates)];
                case 1:
                    updated = _a.sent();
                    return [2 /*return*/, updated || undefined];
            }
        });
    }); },
    deleteTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.TaskService.deleteTask(taskId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    completeTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        var completed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.TaskService.completeTask(taskId)];
                case 1:
                    completed = _a.sent();
                    return [2 /*return*/, completed || undefined];
            }
        });
    }); },
    uncompleteTask: function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        var uncompleted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.TaskService.uncompleteTask(taskId)];
                case 1:
                    uncompleted = _a.sent();
                    return [2 /*return*/, uncompleted || undefined];
            }
        });
    }); },
    getTasksByDateRange: function (startDate_1, endDate_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([startDate_1, endDate_1], args_1, true), void 0, function (startDate, endDate, days) {
            var userId, start, end, tasks;
            if (days === void 0) { days = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getUserId()];
                    case 1:
                        userId = _a.sent();
                        if (!userId)
                            return [2 /*return*/, []];
                        start = startDate || new Date();
                        end = endDate || new Date(start);
                        if (!endDate && days > 0) {
                            end.setDate(end.getDate() + days);
                        }
                        return [4 /*yield*/, db_utils_1.TaskService.getTasksByDateRange(userId, start, end)];
                    case 2:
                        tasks = _a.sent();
                        // Converter campos null para undefined para compatibilidade de tipo
                        return [2 /*return*/, tasks.map(function (task) { return (__assign(__assign({}, task), { description: task.description || undefined, completedAt: task.completedAt || undefined, dueDate: task.dueDate || undefined, projectId: task.projectId || undefined, sectionId: task.sectionId || undefined, recurrenceType: task.recurrenceType || undefined, recurrenceInterval: task.recurrenceInterval || undefined })); })];
                }
            });
        });
    },
};
// Project operations
exports.ProjectService = {
    getAllProjects: function () { return __awaiter(void 0, void 0, void 0, function () {
        var userId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId)
                        return [2 /*return*/, []];
                    return [2 /*return*/, db_utils_1.ProjectService.getAllProjects(userId)];
            }
        });
    }); },
    getProjectById: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        var project;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.ProjectService.getProjectById(projectId)];
                case 1:
                    project = _a.sent();
                    return [2 /*return*/, project || undefined];
            }
        });
    }); },
    createProject: function (project) { return __awaiter(void 0, void 0, void 0, function () {
        var userId, projectWithUserId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserId()];
                case 1:
                    userId = _a.sent();
                    if (!userId) {
                        throw new Error('Usuário não autenticado');
                    }
                    projectWithUserId = __assign(__assign({}, project), { userId: userId });
                    // Tipando de forma mais específica
                    return [2 /*return*/, db_utils_1.ProjectService.createProject(projectWithUserId)];
            }
        });
    }); },
    updateProject: function (projectId, updates) { return __awaiter(void 0, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.ProjectService.updateProject(projectId, updates)];
                case 1:
                    updated = _a.sent();
                    return [2 /*return*/, updated || undefined];
            }
        });
    }); },
    deleteProject: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.ProjectService.deleteProject(projectId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
};
// Section operations
exports.SectionService = {
    getSectionsByProjectId: function (projectId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_utils_1.SectionService.getSectionsByProjectId(projectId)];
        });
    }); },
    createSection: function (section) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_utils_1.SectionService.createSection(section)];
        });
    }); },
    updateSection: function (sectionId, updates) { return __awaiter(void 0, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.SectionService.updateSection(sectionId, updates)];
                case 1:
                    updated = _a.sent();
                    return [2 /*return*/, updated || undefined];
            }
        });
    }); },
    deleteSection: function (sectionId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_utils_1.SectionService.deleteSection(sectionId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
};
