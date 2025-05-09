document.getElementById('generateBtn').addEventListener('click', () => {
    const input = document.getElementById('logicExpr').value;
    drawCircuit(input);
});

function drawCircuit(expression) {
    const canvas = document.getElementById('circuitDiagram');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const expandedExpr = expandExpression(expression);
    const ast = parseExpression(expandedExpr);
    drawNode(ctx, ast, canvas.width / 2, 40);
}


// 🧠 Рекурсивный парсер логических выражений
function parseExpression(expr) {
    expr = expr.replace(/\s+/g, '');

    // Удаляем внешние скобки
    if (expr[0] === '(' && expr[expr.length - 1] === ')') {
        let count = 0;
        let valid = true;
        for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(') count++;
            else if (expr[i] === ')') count--;
            if (count === 0 && i < expr.length - 1) {
                valid = false;
                break;
            }
        }
        if (valid) {
            return parseExpression(expr.slice(1, -1));
        }
    }

    const operators = ['<=>', '=>', '||', '&&'];
    for (let op of operators) {
        let index = findMainOperator(expr, op);
        if (index !== -1) {
            return {
                type: op,
                left: parseExpression(expr.slice(0, index)),
                right: parseExpression(expr.slice(index + op.length))
            };
        }
    }

    if (expr.startsWith('!')) {
        return {
            type: '!',
            expr: parseExpression(expr.slice(1))
        };
    }

    return { type: 'var', name: expr };
}

function findMainOperator(expr, op) {
    let depth = 0;
    for (let i = 0; i <= expr.length - op.length; i++) {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') depth--;
        else if (depth === 0 && expr.slice(i, i + op.length) === op) {
            return i;
        }
    }
    return -1;
}
function expandExpression(expr) {
    expr = expr.replace(/\s+/g, '');

    // Эквиваленция: A <=> B → (A && B) || (!A && !B)
    expr = expr.replace(/([A-Z()!&|<=>]+)<=>+([A-Z()!&|<=>]+)/g, (_, a, b) => {
        return `((${a} && ${b}) || (!${a} && !${b}))`;
    });

    // Импликация: A => B → !A || B
    expr = expr.replace(/([A-Z()!&|<=>]+)=>+([A-Z()!&|<=>]+)/g, (_, a, b) => {
        return `(!${a} || ${b})`;
    });

    return expr;
}

// 🎨 Рекурсивная отрисовка схемы
function drawNode(ctx, node, x, y, level = 0) {
    const boxWidth = 50;
    const boxHeight = 50;
    const spacingY = 100;
    const spacingX = 120;

    if (node.type === 'var') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + boxHeight / 2);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = '16px Manrope';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, x, y - 5);
        return y + boxHeight / 2;
    }

    if (node.type === '!') {
        let childY = drawNode(ctx, node.expr, x, y + spacingY, level + 1);

        // Линия от child к кругу (инверсия)
        ctx.beginPath();
        ctx.moveTo(x, childY);
        ctx.lineTo(x, childY + 15);
        ctx.stroke();

        // Рисуем инверсию — кружочек
        ctx.beginPath();
        ctx.arc(x, childY + 25, 5, 0, 2 * Math.PI);
        ctx.stroke();

        return childY + 30;
    }

    // Бинарные операторы
    const leftX = x - spacingX / Math.pow(1.5, level);
    const rightX = x + spacingX / Math.pow(1.5, level);

    const leftY = drawNode(ctx, node.left, leftX, y + spacingY, level + 1);
    const rightY = drawNode(ctx, node.right, rightX, y + spacingY, level + 1);

    const joinY = Math.max(leftY, rightY) + 20;

    // Линии от детей вверх
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(x, joinY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, rightY);
    ctx.lineTo(x, joinY);
    ctx.stroke();

    // Оператор в квадрате
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x - boxWidth / 2, joinY, boxWidth, boxHeight);

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = '20px Manrope';

    const symbols = {
        '&&': '&',
        '||': '1',
        '=>': '→',
        '<=>': '⇔'
    };
    ctx.fillText(symbols[node.type] || node.type, x, joinY + boxHeight / 2 + 6);

    // Выход из квадрата
    ctx.beginPath();
    ctx.moveTo(x, joinY + boxHeight);
    ctx.lineTo(x, joinY + boxHeight + 20);
    ctx.stroke();

    return joinY + boxHeight + 20;
}
