// circuit.js

class LogicCircuit {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gateSize = 40;
        this.padding = 40;
        this.variableSpacing = 60;
        this.horizontalSpacing = 120;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    drawInputLine(x, y, length, label, isNegated = false) {
        // Линия входа
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + length, y);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Подпись переменной
        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(label, x - 10, y + 5);

        // Кружок отрицания (если нужно)
        if (isNegated) {
            this.ctx.beginPath();
            this.ctx.arc(x + length - 10, y, 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        return { x: x + length, y };
    }

    drawGate(x, y, operation) {
        const half = this.gateSize / 2;
        
        // Рисуем квадрат операции
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(x - half, y - half, this.gateSize, this.gateSize);
        this.ctx.fill();
        this.ctx.stroke();

        // Подпись операции внутри квадрата
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        
        // Используем оригинальные символы операций
        let opSymbol;
        switch(operation) {
            case 'AND': opSymbol = '∧'; break;
            case 'OR': opSymbol = '∨'; break;
            case 'NOT': opSymbol = '¬'; break;
            case 'IMPL': opSymbol = '⇒'; break;
            case 'EQ': opSymbol = '⇔'; break;
            default: opSymbol = operation;
        }
        this.ctx.fillText(opSymbol, x, y + 5);

        return {
            inputs: [
                { x: x - half, y: y - 15 },
                { x: x - half, y: y + 15 }
            ],
            output: { x: x + half, y }
        };
    }

    drawOutputLine(x, y, length, formula) {
        // Линия выхода
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + length, y);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Подпись выхода (полная формула)
        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(formula, x + length + 10, y + 5);
    }

    parseExpression(expr) {
        // Разбиваем выражение на токены
        const tokens = expr.match(/([A-Za-z]+|[∧∨¬⇒⇔()]|&&|\|\||!|=>|===)/g) || [];
        
        // Преобразуем в обратную польскую нотацию (RPN)
        const output = [];
        const operators = [];
        const precedence = {
            '!': 4, '¬': 4,
            '∧': 3, '&&': 3,
            '∨': 2, '||': 2,
            '⇒': 1, '=>': 1,
            '⇔': 0, '===': 0
        };

        for (const token of tokens) {
            if (/[A-Za-z]+/.test(token)) {
                output.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop(); // Удаляем '('
            } else {
                while (operators.length && 
                       operators[operators.length - 1] !== '(' &&
                       precedence[operators[operators.length - 1]] >= precedence[token]) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }

        while (operators.length) {
            output.push(operators.pop());
        }

        return output;
    }

    buildExpressionTree(tokens) {
        const stack = [];
        
        for (const token of tokens) {
            if (/[A-Za-z]+/.test(token)) {
                stack.push({
                    type: 'variable',
                    value: token
                });
            } else {
                let right, left;
                if (token === '¬' || token === '!') {
                    right = stack.pop();
                    stack.push({
                        type: 'operation',
                        op: token,
                        right
                    });
                } else {
                    right = stack.pop();
                    left = stack.pop();
                    stack.push({
                        type: 'operation',
                        op: token,
                        left,
                        right
                    });
                }
            }
        }
        
        return stack.pop();
    }

    drawExpression(node, startX, startY, depth = 0) {
        if (node.type === 'variable') {
            const isNegated = false; // Отрицание обрабатывается в операциях
            const line = this.drawInputLine(
                startX, 
                startY, 
                50, 
                node.value, 
                isNegated
            );
            return { ...line, width: 50 };
        }

        const gateX = startX + 100 + depth * this.horizontalSpacing;
        let gateY = startY;
        
        // Рисуем левую часть (если есть)
        let leftResult = null;
        if (node.left) {
            leftResult = this.drawExpression(node.left, startX, startY, depth + 1);
            gateY = leftResult.y;
        }
        
        // Рисуем правую часть
        let rightResult = this.drawExpression(node.right, startX, 
            node.left ? startY + this.variableSpacing : startY, 
            depth + 1);
        
        if (!node.left) {
            gateY = rightResult.y;
        } else {
            gateY = (leftResult.y + rightResult.y) / 2;
        }
        
        // Рисуем саму операцию
        const gate = this.drawGate(gateX, gateY, this.getOperationName(node.op));
        
        // Соединяем с входами
        if (node.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(leftResult.x, leftResult.y);
            this.ctx.lineTo(gate.inputs[0].x, gate.inputs[0].y);
            this.ctx.stroke();
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(rightResult.x, rightResult.y);
        this.ctx.lineTo(gate.inputs[node.left ? 1 : 0].x, gate.inputs[node.left ? 1 : 0].y);
        this.ctx.stroke();
        
        // Для отрицания рисуем кружок
        if ((node.op === '¬' || node.op === '!') && node.right.type === 'variable') {
            this.ctx.beginPath();
            this.ctx.arc(gate.inputs[0].x + 10, gate.inputs[0].y, 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        return { 
            x: gate.output.x, 
            y: gate.output.y,
            width: 100 + depth * this.horizontalSpacing
        };
    }

    drawCircuit(expr) {
        this.clear();
        
        try {
            const tokens = this.parseExpression(expr);
            const expressionTree = this.buildExpressionTree(tokens);
            
            // Рассчитываем размеры canvas
            const variables = this.collectVariables(expressionTree);
            const height = this.padding * 2 + variables.length * this.variableSpacing;
            const width = 800;
            this.setCanvasSize(width, height);
            
            // Рисуем выражение
            const startY = this.padding + (variables.length - 1) * this.variableSpacing / 2;
            const result = this.drawExpression(expressionTree, this.padding, startY);
            
            // Рисуем выход
            this.drawOutputLine(result.x, result.y, 100, expr);
            
        } catch (e) {
            console.error("Error drawing circuit:", e);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Error: ' + e.message, this.canvas.width / 2, 30);
        }
    }

    collectVariables(node) {
        if (node.type === 'variable') {
            return [node.value];
        }
        
        const vars = [];
        if (node.left) {
            vars.push(...this.collectVariables(node.left));
        }
        if (node.right) {
            vars.push(...this.collectVariables(node.right));
        }
        
        return [...new Set(vars)]; // Удаляем дубликаты
    }

    getOperationName(op) {
        switch (op) {
            case '∧': case '&&': return 'AND';
            case '∨': case '||': return 'OR';
            case '¬': case '!': return 'NOT';
            case '⇒': case '=>': return 'IMPL';
            case '⇔': case '===': return 'EQ';
            default: return op;
        }
    }
}

// Инициализация и подключение к интерфейсу
document.addEventListener('DOMContentLoaded', () => {
    const circuit = new LogicCircuit('circuitDiagram');
    const generateBtn = document.getElementById('generateBtn');
    const logicExprInput = document.getElementById('logicExpr');
    
    generateBtn.addEventListener('click', () => {
        circuit.drawCircuit(logicExprInput.value);
    });
    
    logicExprInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            circuit.drawCircuit(logicExprInput.value);
        }
    });
});