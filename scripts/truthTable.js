// truthTable.js

/**
 * Парсит логическое выражение и возвращает список переменных и операций
 * @param {string} expr Логическое выражение
 * @returns {Object} Объект с переменными и операциями
 */
function parseExpression(expr) {
    // Удаляем лишние пробелы
    expr = expr.replace(/\s+/g, '');
    
    // Находим все переменные (латинские буквы)
    const variables = [...new Set(expr.match(/[A-Za-z]+/g) || [])];
    
    // Находим все операции
    const operations = [];
    let i = 0;
    
    while (i < expr.length) {
        if (expr.substr(i, 3) === '===') {
            operations.push('===');
            i += 3;
        } else if (expr.substr(i, 2) === '=>') {
            operations.push('=>');
            i += 2;
        } else if (expr.substr(i, 2) === '&&') {
            operations.push('&&');
            i += 2;
        } else if (expr.substr(i, 2) === '||') {
            operations.push('||');
            i += 2;
        } else if (['∧', '∨', '¬', '⇒', '⇔', '!'].includes(expr[i])) {
            operations.push(expr[i]);
            i++;
        } else if (expr[i] === '(' || expr[i] === ')') {
            i++;
        } else if (/[A-Za-z]/.test(expr[i])) {
            i++;
        } else {
            i++;
        }
    }
    
    return { variables, operations };
}

/**
 * Генерирует все возможные комбинации значений для заданных переменных
 * @param {Array} variables Массив переменных
 * @returns {Array} Массив объектов с комбинациями значений
 */
function generateCombinations(variables) {
    const count = variables.length;
    const total = Math.pow(2, count);
    const combinations = [];

    for (let i = 0; i < total; i++) {
        const combination = {};
        for (let j = 0; j < count; j++) {
            combination[variables[j]] = (i >> j) & 1;
        }
        combinations.push(combination);
    }

    return combinations;
}

/**
 * Вычисляет значение подвыражения
 * @param {string} op Оператор
 * @param {number} left Левый операнд (может быть null для NOT)
 * @param {number} right Правый операнд
 * @returns {number} Результат вычисления (0 или 1)
 */
function evaluateOperation(op, left, right) {
    switch (op) {
        case '∧': case '&&': return left && right ? 1 : 0;
        case '∨': case '||': return left || right ? 1 : 0;
        case '¬': case '!': return right ? 0 : 1;
        case '⇒': case '=>': return left && !right ? 0 : 1; // !A || B
        case '⇔': case '===': return left === right ? 1 : 0; // (A && B) || (!A && !B)
        default: return 0;
    }
}

/**
 * Разбивает выражение на подвыражения и вычисляет их пошагово
 * @param {string} expr Логическое выражение
 * @param {Object} values Значения переменных
 * @returns {Object} Объект с результатами всех подвыражений
 */
function evaluateStepByStep(expr, values) {
    // Создаем копию выражения для обработки
    let currentExpr = expr.replace(/\s+/g, '');
    const results = { ...values };
    
    // Обрабатываем отрицания
    currentExpr = currentExpr.replace(/([A-Za-z]+|\))([¬!])/g, '$2$1');
    
    // Функция для замены подвыражений на их результаты
    const replaceSubExpr = (subExpr) => {
        // Удаляем внешние скобки если есть
        const cleanExpr = subExpr.startsWith('(') && subExpr.endsWith(')') ? 
            subExpr.slice(1, -1) : subExpr;
        
        // Пытаемся вычислить подвыражение
        let result = 0;
        
        // Обработка отрицания
        if (cleanExpr.startsWith('¬') || cleanExpr.startsWith('!')) {
            const varName = cleanExpr.slice(1);
            result = results[varName] ? 0 : 1;
            results[`${cleanExpr[0]}${varName}`] = result;
            return result;
        }
        
        // Ищем оператор с наивысшим приоритетом
        const operators = [
            { regex: /([∧&]{2}|[∨|]{2})/, op: cleanExpr.includes('&&') ? '&&' : '||' },
            { regex: /[⇒=>]/, op: '=>' },
            { regex: /[⇔===]/, op: '===' }
        ];
        
        let found = false;
        for (const { regex, op } of operators) {
            const match = cleanExpr.match(regex);
            if (match) {
                const [left, right] = cleanExpr.split(match[0]);
                const leftVal = results[left] !== undefined ? results[left] : parseInt(left);
                const rightVal = results[right] !== undefined ? results[right] : parseInt(right);
                result = evaluateOperation(op, leftVal, rightVal);
                results[`(${left}${match[0]}${right})`] = result;
                found = true;
                break;
            }
        }
        
        if (!found && results[cleanExpr] !== undefined) {
            result = results[cleanExpr];
        }
        
        return result;
    };
    
    // Обрабатываем все подвыражения в скобках
    while (currentExpr.includes('(')) {
        currentExpr = currentExpr.replace(/\(([^()]+)\)/g, (match, subExpr) => {
            const result = replaceSubExpr(subExpr);
            return result;
        });
    }
    
    // Обрабатываем оставшееся выражение
    replaceSubExpr(currentExpr);
    
    return results;
}

/**
 * Создаёт HTML-таблицу на основе данных
 * @param {Array} variables Массив переменных
 * @param {string} expr Исходное выражение
 * @param {Array} data Массив с результатами вычислений
 */
function renderTruthTable(variables, expr, data) {
    const tableContainer = document.getElementById("truthTable");
    tableContainer.innerHTML = "";

    const table = document.createElement("table");
    table.className = "truth-table";

    // Создаём заголовок таблицы
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Добавляем заголовки для переменных
    variables.forEach(variable => {
        const th = document.createElement("th");
        th.textContent = variable;
        headerRow.appendChild(th);
    });

    // Добавляем заголовки для всех подвыражений
    const subExpressions = Object.keys(data[0]).filter(key => !variables.includes(key));
    subExpressions.forEach(subExpr => {
        const th = document.createElement("th");
        
        // Заменяем операторы на символьные обозначения
        let displayExpr = subExpr
            .replace(/&&/g, '∧')
            .replace(/\|\|/g, '∨')
            .replace(/!/g, '¬')
            .replace(/=>/g, '⇒')
            .replace(/===/g, '⇔');
            
        th.textContent = displayExpr;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Создаём тело таблицы
    const tbody = document.createElement("tbody");

    // Добавляем строки с данными
    data.forEach(row => {
        const tr = document.createElement("tr");

        // Добавляем значения переменных
        variables.forEach(variable => {
            const td = document.createElement("td");
            td.textContent = row[variable];
            tr.appendChild(td);
        });

        // Добавляем результаты подвыражений
        subExpressions.forEach(subExpr => {
            const td = document.createElement("td");
            td.textContent = row[subExpr];
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

/**
 * Основная функция для генерации таблицы истинности
 * @param {string} expr Введённое пользователем выражение
 */
function generateTruthTable(expr) {
    if (!expr.trim()) {
        alert("Пожалуйста, введите логическое выражение");
        return;
    }

    try {
        // Парсим выражение
        const { variables } = parseExpression(expr);
        
        // Генерируем все комбинации значений переменных
        const combinations = generateCombinations(variables);
        
        // Для каждой комбинации вычисляем все подвыражения
        const data = combinations.map(values => {
            return evaluateStepByStep(expr, values);
        });

        renderTruthTable(variables, expr, data);
    } catch (e) {
        alert("Ошибка при обработке выражения: " + e.message);
        console.error(e);
    }
}

// Подключаем обработчик кнопки
document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generateBtn");
    const logicExprInput = document.getElementById("logicExpr");

    generateBtn.addEventListener("click", () => {
        generateTruthTable(logicExprInput.value);
    });

    // Можно добавить обработчик нажатия Enter
    logicExprInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            generateTruthTable(logicExprInput.value);
        }
    });
});