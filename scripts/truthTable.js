// truthTable.js

/**
 * Парсит логическое выражение и возвращает список переменных
 * @param {string} expr Логическое выражение
 * @returns {Array} Массив уникальных переменных
 */
function extractVariables(expr) {
    const variables = expr.match(/[A-Za-z]+/g) || [];
    return [...new Set(variables)]; // Удаляем дубликаты
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
 * Вычисляет значение логического выражения для заданных значений переменных
 * @param {string} expr Логическое выражение
 * @param {Object} values Значения переменных
 * @returns {number} Результат вычисления (0 или 1)
 */
function evaluateExpression(expr, values) {
    // Заменяем переменные на их значения
    let evaluatedExpr = expr;
    for (const [varName, value] of Object.entries(values)) {
        evaluatedExpr = evaluatedExpr.replace(new RegExp(varName, 'g'), value);
    }

    // Заменяем логические операторы на JS-эквиваленты
    evaluatedExpr = evaluatedExpr
        .replace(/∧/g, '&&')
        .replace(/∨/g, '||')
        .replace(/¬/g, '!')
        .replace(/⇒/g, '=>')
        .replace(/⇔/g, '===');

    // Вычисляем выражение
    try {
        return eval(evaluatedExpr) ? 1 : 0;
    } catch (e) {
        console.error("Ошибка вычисления выражения:", e);
        return 0;
    }
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

    // Добавляем заголовок для выражения
    const exprTh = document.createElement("th");
    exprTh.innerHTML = formatExpression(expr);
    headerRow.appendChild(exprTh);

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

        // Добавляем результат выражения
        const resultTd = document.createElement("td");
        resultTd.textContent = row.result;
        tr.appendChild(resultTd);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

/**
 * Форматирует выражение для отображения в HTML
 * @param {string} expr Логическое выражение
 * @returns {string} Отформатированное выражение
 */
function formatExpression(expr) {
    return expr
        .replace(/&/g, '&and;')
        .replace(/or/g, '&or;')
        .replace(/!/g, '&not;')
        .replace(/->/g, '&rArr;')
        .replace(/<->/g, '&hArr;');
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
        const variables = extractVariables(expr);
        const combinations = generateCombinations(variables);
        
        const data = combinations.map(values => {
            return {
                ...values,
                result: evaluateExpression(expr, values)
            };
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