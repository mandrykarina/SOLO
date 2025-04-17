// circuit.js

class LogicCircuit {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gateSize = 40;
        this.padding = 40;
        this.horizontalSpacing = 120;
        this.verticalSpacing = 60;
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
        // Удаляем все пробелы для упрощения парсинга
        expr = expr.replace(/\s/g, '');
        
        const tokens = [];
        let i = 0;
        
        while (i < expr.length) {
            if (expr[i] === '(' || expr[i] === ')') {
                tokens.push(expr[i]);
                i++;
            }
            // Проверяем многосимвольные операторы (=>, ===, &&, ||)
            else if (expr.substr(i, 3) === '===') {
                tokens.push('===');
                i += 3;
            }
            else if (expr.substr(i, 2) === '=>') {
                tokens.push('=>');
                i += 2;
            }
            else if (expr.substr(i, 2) === '&&') {
                tokens.push('&&');
                i += 2;
            }
            else if (expr.substr(i, 2) === '||') {
                tokens.push('||');
                i += 2;
            }
            // Односимвольные операторы
            else if (['∧', '∨', '¬', '⇒', '⇔', '!'].includes(expr[i])) {
                tokens.push(expr[i]);
                i++;
            }
            // Переменные (буквы)
            else if (/[A-Za-z]/.test(expr[i])) {
                let varName = '';
                while (i < expr.length && /[A-Za-z]/.test(expr[i])) {
                    varName += expr[i];
                    i++;
                }
                tokens.push(varName);
            }
            else {
                i++; // Пропускаем неизвестные символы
            }
        }
        
        return tokens;
    }

    buildExpressionTree(tokens) {
        const stack = [];
        const output = [];
        const precedence = {
            '!': 5, '¬': 5,
            '∧': 4, '&&': 4,
            '∨': 3, '||': 3,
            '⇒': 2, '=>': 2,
            '⇔': 1, '===': 1
        };

        for (const token of tokens) {
            if (/[A-Za-z]+/.test(token)) {
                output.push({ type: 'variable', value: token });
            } else if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length && stack[stack.length - 1] !== '(') {
                    this.processOperator(stack.pop(), output);
                }
                stack.pop(); // Удаляем '('
            } else {
                while (stack.length && stack[stack.length - 1] !== '(' &&
                       precedence[stack[stack.length - 1]] >= precedence[token]) {
                    this.processOperator(stack.pop(), output);
                }
                stack.push(token);
            }
        }

        while (stack.length) {
            this.processOperator(stack.pop(), output);
        }

        return output[0];
    }

    processOperator(op, output) {
        if (op === '¬' || op === '!') {
            const right = output.pop();
            output.push({
                type: 'operation',
                op,
                right,
                isNegated: true
            });
        } else {
            const right = output.pop();
            const left = output.pop();
            output.push({
                type: 'operation',
                op,
                left,
                right
            });
        }
    }

    drawExpression(node, startX, startY, depth = 0) {
        if (node.type === 'variable') {
            const line = this.drawInputLine(
                startX, 
                startY, 
                50, 
                node.value,
                false
            );
            return { 
                x: line.x, 
                y: line.y,
                width: 50,
                height: 0
            };
        }

        const gateX = startX + 100 + depth * this.horizontalSpacing;
        
        // Рисуем правую часть (для NOT) или обе части (для бинарных операций)
        let rightResult = this.drawExpression(node.right, startX, startY, depth + 1);
        
        let leftResult = null;
        if (node.left) {
            leftResult = this.drawExpression(
                node.left, 
                startX, 
                startY + rightResult.height + this.verticalSpacing, 
                depth + 1
            );
        }

        // Вычисляем положение гейта
        let gateY;
        if (node.left) {
            gateY = (leftResult.y + rightResult.y) / 2;
        } else {
            gateY = rightResult.y;
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
        
        const inputIndex = node.left ? 1 : 0;
        this.ctx.beginPath();
        this.ctx.moveTo(rightResult.x, rightResult.y);
        this.ctx.lineTo(gate.inputs[inputIndex].x, gate.inputs[inputIndex].y);
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
            width: 100 + depth * this.horizontalSpacing,
            height: (node.left ? leftResult.height + rightResult.height + this.verticalSpacing : rightResult.height)
        };
    }

    calculateCanvasSize(node) {
        if (node.type === 'variable') {
            return { width: 200, height: 80 };
        }
        
        const rightSize = this.calculateCanvasSize(node.right);
        let leftSize = { width: 0, height: 0 };
        
        if (node.left) {
            leftSize = this.calculateCanvasSize(node.left);
        }
        
        return {
            width: Math.max(leftSize.width, rightSize.width) + this.horizontalSpacing,
            height: leftSize.height + rightSize.height + (node.left ? this.verticalSpacing : 0)
        };
    }

    drawCircuit(expr) {
        this.clear();
        
        try {
            const tokens = this.parseExpression(expr);
            const expressionTree = this.buildExpressionTree(tokens);
            
            // Рассчитываем размеры canvas
            const { width, height } = this.calculateCanvasSize(expressionTree);
            this.setCanvasSize(width + 200, Math.max(height + 100, 300));
            
            // Рисуем выражение
            const result = this.drawExpression(expressionTree, this.padding, this.padding);
            
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