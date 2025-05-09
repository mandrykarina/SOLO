document.getElementById('generateBtn').addEventListener('click', () => {
    const input = document.getElementById('logicExpr').value;
    generateTruthTable(input);
});

function validateExpression(expr) {
    if (!expr.trim()) return "Выражение не должно быть пустым.";

    const openBrackets = (expr.match(/\(/g) || []).length;
    const closeBrackets = (expr.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) return "Скобки не сбалансированы.";

    try {
        const mockVars = 'let A=true,B=false,C=true,D=false;';
        const testExpr = preprocessExpression(expandImplications(expr));
        new Function(mockVars + `return (${testExpr});`)();
    } catch (e) {
        return "Синтаксическая ошибка: " + e.message;
    }

    return null;
}

function generateTruthTable(expr) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '';

    const validationError = validateExpression(expr);
    if (validationError) {
        errorDiv.textContent = validationError;
        return;
    }

    const container = document.getElementById('truthTable');
    container.innerHTML = '';

    const variables = getVariables(expr);
    const logicExpr = expandImplications(expr.trim());
    const usedNegations = getUsedNegations(logicExpr, variables);
    const subExprs = getSubExpressions(logicExpr);
    const allExprs = buildOrderedExprList(variables, usedNegations, subExprs, logicExpr);

    const combinations = generateCombinations(variables);
    const rows = combinations.map(combo => evaluateRow(combo, allExprs));

    const table = document.createElement('table');
    table.className = 'truth-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    allExprs.forEach(expr => {
        const th = document.createElement('th');
        th.textContent = formatExpr(expr);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        allExprs.forEach(expr => {
            const td = document.createElement('td');
            td.textContent = row[expr] ? '1' : '0';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

// Поддержка импликации и эквиваленции
function expandImplications(expr) {
    function expand(e) {
        e = e.trim();
        if (e.startsWith('(') && e.endsWith(')') && isBalanced(e.slice(1, -1))) {
            e = e.slice(1, -1);
        }

        let i = findMainOperator(e, '<=>');
        if (i !== -1) {
            const left = expand(e.slice(0, i));
            const right = expand(e.slice(i + 3));
            return `((${left} && ${right}) || (!${left} && !${right}))`;
        }

        i = findMainOperator(e, '=>');
        if (i !== -1) {
            const left = expand(e.slice(0, i));
            const right = expand(e.slice(i + 2));
            return `(!${left} || ${right})`;
        }

        return e;
    }

    return expand(expr);
}

function findMainOperator(expr, op) {
    let depth = 0;
    for (let i = 0; i < expr.length - op.length + 1; i++) {
        const part = expr.slice(i, i + op.length);
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') depth--;
        if (depth === 0 && part === op) return i;
    }
    return -1;
}

function isBalanced(expr) {
    let depth = 0;
    for (let ch of expr) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (depth < 0) return false;
    }
    return depth === 0;
}

function getVariables(expr) {
    const matches = expr.match(/\b[A-Za-z]\w*\b/g) || [];
    return [...new Set(matches)];
}

function getUsedNegations(expr, variables) {
    const negations = new Set();
    variables.forEach(v => {
        const regex = new RegExp(`!${v}\\b`);
        if (regex.test(expr)) {
            negations.add(`!${v}`);
        }
    });
    return [...negations];
}

function getSubExpressions(expr) {
    const result = new Set();
    const stack = [];

    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') stack.push(i);
        else if (expr[i] === ')') {
            const start = stack.pop();
            if (start !== undefined) {
                const sub = expr.slice(start, i + 1);
                result.add(sub);
            }
        }
    }

    const simpleMatches = expr.match(/!?[A-Za-z]\w*(\s*(\|\||&&|=>|<=>)\s*!?[A-Za-z]\w*)+/g);
    if (simpleMatches) {
        simpleMatches.forEach(e => result.add(e.trim()));
    }

    return [...result];
}

function generateCombinations(variables) {
    const total = 2 ** variables.length;
    const combinations = [];

    for (let i = 0; i < total; i++) {
        const combo = {};
        for (let j = 0; j < variables.length; j++) {
            combo[variables[j]] = Boolean((i >> (variables.length - j - 1)) & 1);
        }
        combinations.push(combo);
    }

    return combinations;
}

function buildOrderedExprList(vars, negs, subs, finalExpr) {
    const seen = new Set();
    const addUnique = list => list.filter(x => {
        const norm = normalizeExpr(x);
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
    });

    return [
        ...addUnique(vars),
        ...addUnique(negs),
        ...addUnique(subs),
        ...addUnique([finalExpr])
    ];
}

function preprocessExpression(expr) {
    return expr
        .replace(/\s+/g, '')
        .replace(/&&/g, '&&')
        .replace(/\|\|/g, '||')
        .replace(/!/g, '!')
        .replace(/===/g, '===');
}

function normalizeExpr(expr) {
    return expr.replace(/\s+/g, '').replace(/^\((.*)\)$/, '$1');
}

function evaluateRow(combo, exprList) {
    const row = { ...combo };
    const context = Object.entries(combo).map(([k, v]) => `let ${k} = ${v};`).join('');

    for (const expr of exprList) {
        try {
            const jsExpr = preprocessExpression(expr);
            const value = new Function(context + `return (${jsExpr});`)();
            row[expr] = Boolean(value);
        } catch {
            row[expr] = false;
        }
    }

    return row;
}

function formatExpr(expr) {
    return expr
        .replace(/&&/g, '∧')
        .replace(/\|\|/g, '∨')
        .replace(/!/g, '¬')
        .replace(/=>/g, '→')
        .replace(/===/g, '⇔');
}
