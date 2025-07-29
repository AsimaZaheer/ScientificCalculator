 let display = document.getElementById('display');
        let modeDisplay = document.getElementById('modeDisplay');
        let currentInput = '';
        let memory = 0;
        let answer = 0;
        let isShiftOn = false;
        let isAlphaOn = false;
        let isDegreeMode = true;
        let cursorPosition = 0;
        let history = [];
        let historyIndex = -1;

        // Helper functions for angle conversion
        function toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        function toDegrees(radians) {
            return radians * (180 / Math.PI);
        }

        // Custom trigonometric functions that handle degree/radian modes
        function customSin(value) {
            return Math.sin(isDegreeMode ? toRadians(value) : value);
        }

        function customCos(value) {
            return Math.cos(isDegreeMode ? toRadians(value) : value);
        }

        function customTan(value) {
            return Math.tan(isDegreeMode ? toRadians(value) : value);
        }

        function customAsin(value) {
            // Ensure value is a number
            const numValue = parseFloat(value);
            
            // Check domain: asin is only defined for values between -1 and 1
            if (isNaN(numValue) || numValue < -1 || numValue > 1) {
                return NaN;
            }
            
            const result = Math.asin(numValue);
            return isDegreeMode ? toDegrees(result) : result;
        }

        function customAcos(value) {
            // Ensure value is a number
            const numValue = parseFloat(value);
            
            // Check domain: acos is only defined for values between -1 and 1
            if (isNaN(numValue) || numValue < -1 || numValue > 1) {
                return NaN;
            }
            
            const result = Math.acos(numValue);
            return isDegreeMode ? toDegrees(result) : result;
        }

        function customAtan(value) {
            // Ensure value is a number
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                return NaN;
            }
            
            const result = Math.atan(numValue);
            return isDegreeMode ? toDegrees(result) : result;
        }

        function inputValue(value) {
            if (value === 'Ans') {
                currentInput = currentInput.slice(0, cursorPosition) + answer + currentInput.slice(cursorPosition);
                cursorPosition += answer.toString().length;
            } else {
                currentInput = currentInput.slice(0, cursorPosition) + value + currentInput.slice(cursorPosition);
                cursorPosition += value.length;
            }
            display.value = currentInput;
        }
        
        function clearDisplay() {
            currentInput = '';
            cursorPosition = 0;
            display.value = '';
        }
        
        function deleteLast() {
            if (cursorPosition > 0) {
                currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
                cursorPosition--;
                display.value = currentInput;
            }
        }
        
        function moveCursor(direction) {
            switch(direction) {
                case 'left':
                    if (cursorPosition > 0) cursorPosition--;
                    break;
                case 'right':
                    if (cursorPosition < currentInput.length) cursorPosition++;
                    break;
                case 'up':
                    if (historyIndex < history.length - 1) {
                        historyIndex++;
                        currentInput = history[history.length - 1 - historyIndex];
                        cursorPosition = currentInput.length;
                    }
                    break;
                case 'down':
                    if (historyIndex > 0) {
                        historyIndex--;
                        currentInput = history[history.length - 1 - historyIndex];
                        cursorPosition = currentInput.length;
                    } else if (historyIndex === 0) {
                        historyIndex = -1;
                        currentInput = '';
                        cursorPosition = 0;
                    }
                    break;
            }
            display.value = currentInput;
        }
        
        function calculateResult() {
            try {
                // Clean up the input and prepare for evaluation
                let expression = currentInput.trim();
                
                if (!expression) {
                    display.value = '';
                    return;
                }
                
                // Replace mathematical operators and functions
                expression = expression
                    .replace(/\^/g, '**')
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, 'Math.PI')
                    .replace(/Math\.PI/g, 'Math.PI');
                
                // Handle trigonometric functions - be very careful with order
                // Do inverse functions first to avoid conflicts
                expression = expression
                    .replace(/asin\(/g, 'customAsin(')
                    .replace(/acos\(/g, 'customAcos(') 
                    .replace(/atan\(/g, 'customAtan(')
                    .replace(/sinh\(/g, 'Math.sinh(')
                    .replace(/cosh\(/g, 'Math.cosh(')
                    .replace(/tanh\(/g, 'Math.tanh(')
                    .replace(/sin\(/g, 'customSin(')
                    .replace(/cos\(/g, 'customCos(')
                    .replace(/tan\(/g, 'customTan(');
                
                // Handle logarithmic functions
                expression = expression
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(');
                
                // Handle percentage
                expression = expression.replace(/%/g, '/100');
                
                // Evaluate the expression
                answer = eval(expression);
                
                // Check for invalid results
                if (isNaN(answer) || !isFinite(answer)) {
                    display.value = 'Math ERROR';
                    currentInput = '';
                    cursorPosition = 0;
                    return;
                }
                
                // Round very small numbers to avoid floating point errors
                if (Math.abs(answer) < 1e-14) {
                    answer = 0;
                }
                
                // Format the result for display
                let displayValue = answer;
                if (answer.toString().length > 12) {
                    displayValue = parseFloat(answer.toPrecision(10));
                }
                
                display.value = displayValue;
                
                // Update history
                history.push(currentInput);
                if (history.length > 10) history.shift();
                historyIndex = -1;
                
                // Update current input with result
                currentInput = displayValue.toString();
                cursorPosition = currentInput.length;
                
            } catch (error) {
                display.value = 'Math ERROR';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        // Fixed trigonometric function handler
        function trigFunction(func, letter) {
            if (isAlphaOn) {
                // In alpha mode, just input the letter
                inputValue(letter);
                isAlphaOn = false;
                document.querySelector('.alpha').classList.remove('active');
            } else {
                // Handle inverse trig functions properly
                if (func === 'asin' || func === 'acos' || func === 'atan') {
                    // These are already inverse functions
                    if (isShiftOn) {
                        // Shift + inverse = hyperbolic functions
                        switch(func) {
                            case 'asin':
                                inputValue('sinh(');
                                break;
                            case 'acos':
                                inputValue('cosh(');
                                break;
                            case 'atan':
                                inputValue('tanh(');
                                break;
                        }
                        isShiftOn = false;
                        document.querySelector('.shift').classList.remove('active');
                    } else {
                        // Regular inverse functions
                        inputValue(func + '(');
                    }
                } else {
                    // Regular trig functions (sin, cos, tan)
                    if (isShiftOn) {
                        // Shift + regular = inverse functions
                        switch(func) {
                            case 'sin':
                                inputValue('asin(');
                                break;
                            case 'cos':
                                inputValue('acos(');
                                break;
                            case 'tan':
                                inputValue('atan(');
                                break;
                        }
                        isShiftOn = false;
                        document.querySelector('.shift').classList.remove('active');
                    } else {
                        // Regular trigonometric functions
                        inputValue(func + '(');
                    }
                }
            }
        }
        
        function calculateSquare() {
            try {
                answer = eval(currentInput) ** 2;
                display.value = answer;
                currentInput = answer.toString();
                cursorPosition = currentInput.length;
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        function calculateSqrt() {
            try {
                answer = Math.sqrt(eval(currentInput));
                display.value = answer;
                currentInput = answer.toString();
                cursorPosition = currentInput.length;
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        function calculateInverse() {
            try {
                answer = 1 / eval(currentInput);
                display.value = answer;
                currentInput = answer.toString();
                cursorPosition = currentInput.length;
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }

        function logFunction() {
            if (isShiftOn) {
                // Calculate antilog (10^x) when shift is pressed
                try {
                    let value = currentInput ? eval(currentInput) : answer;
                    answer = Math.pow(10, value);
                    display.value = answer;
                    currentInput = answer.toString();
                    cursorPosition = currentInput.length;
                    shiftMode(); // Turn off shift after use
                } catch (error) {
                    display.value = 'Error';
                    currentInput = '';
                    cursorPosition = 0;
                }
            } else {
                inputValue('log(');
            }
        }

        function lnFunction() {
            if (isShiftOn) {
                // Calculate e^x when shift is pressed
                try {
                    let value = currentInput ? eval(currentInput) : answer;
                    answer = Math.exp(value);
                    display.value = answer;
                    currentInput = answer.toString();
                    cursorPosition = currentInput.length;
                    shiftMode(); // Turn off shift after use
                } catch (error) {
                    display.value = 'Error';
                    currentInput = '';
                    cursorPosition = 0;
                }
            } else {
                inputValue('ln(');
            }
        }
        
        function logBaseFunction() {
            if (isShiftOn) {
                // Calculate logarithm with custom base
                try {
                    let base = prompt("Enter base for logarithm:");
                    if (base && !isNaN(base)) {
                        let value = currentInput ? eval(currentInput) : answer;
                        answer = Math.log(value) / Math.log(base);
                        display.value = answer;
                        currentInput = answer.toString();
                        cursorPosition = currentInput.length;
                        shiftMode(); // Turn off shift after use
                    }
                } catch (error) {
                    display.value = 'Error';
                    currentInput = '';
                    cursorPosition = 0;
                }
            } else {
                let base = prompt("Enter base for logarithm:");
                if (base && !isNaN(base)) {
                    inputValue('(Math.log(');
                    // This needs to be completed with )/Math.log(base))
                }
            }
        }
        
        function integralFunction() {
            if (isShiftOn) {
                // Shift + ∫ = Definite integral with limits
                performDefiniteIntegral();
                isShiftOn = false;
                document.querySelector('.shift').classList.remove('active');
            } else {
                // Regular ∫ = Indefinite integral (symbolic)
                performIndefiniteIntegral();
            }
        }
        
        function performDefiniteIntegral() {
            try {
                // Get the function expression from current input
                let funcExpression = currentInput.trim();
                if (!funcExpression) {
                    display.value = 'Enter function first';
                    setTimeout(() => display.value = '', 2000);
                    return;
                }
                
                // Get integration limits
                let lowerLimit = prompt("Enter lower limit (a):");
                let upperLimit = prompt("Enter upper limit (b):");
                
                if (lowerLimit === null || upperLimit === null) return;
                
                lowerLimit = parseFloat(lowerLimit);
                upperLimit = parseFloat(upperLimit);
                
                if (isNaN(lowerLimit) || isNaN(upperLimit)) {
                    display.value = 'Invalid limits';
                    setTimeout(() => display.value = '', 2000);
                    return;
                }
                
                // Perform numerical integration using Simpson's rule
                let result = simpsonsRule(funcExpression, lowerLimit, upperLimit, 1000);
                
                if (isNaN(result) || !isFinite(result)) {
                    display.value = 'Integration Error';
                    setTimeout(() => display.value = '', 2000);
                    return;
                }
                
                // Display result
                answer = result;
                display.value = `∫[${lowerLimit},${upperLimit}] = ${result.toPrecision(8)}`;
                
                // Update history and current input
                history.push(`∫(${funcExpression}) from ${lowerLimit} to ${upperLimit}`);
                if (history.length > 10) history.shift();
                historyIndex = -1;
                currentInput = result.toString();
                cursorPosition = currentInput.length;
                
            } catch (error) {
                display.value = 'Integration Error';
                setTimeout(() => display.value = '', 2000);
            }
        }
        
        function performIndefiniteIntegral() {
            try {
                let funcExpression = currentInput.trim();
                if (!funcExpression) {
                    // If no input, just add integral symbol for manual entry
                    inputValue('∫(');
                    return;
                }
                
                // Try to provide symbolic integration for common functions
                let integral = getSymbolicIntegral(funcExpression);
                
                if (integral) {
                    display.value = `∫(${funcExpression})dx = ${integral} + C`;
                    currentInput = integral;
                    cursorPosition = currentInput.length;
                } else {
                    // If symbolic integration fails, show the integral notation
                    display.value = `∫(${funcExpression})dx`;
                    currentInput = `∫(${funcExpression})dx`;
                    cursorPosition = currentInput.length;
                }
                
                history.push(funcExpression);
                if (history.length > 10) history.shift();
                historyIndex = -1;
                
            } catch (error) {
                inputValue('∫(');
            }
        }
        
        // Simpson's Rule for numerical integration
        function simpsonsRule(expression, a, b, n) {
            // Ensure n is even
            if (n % 2 !== 0) n++;
            
            let h = (b - a) / n;
            let sum = evaluateFunction(expression, a) + evaluateFunction(expression, b);
            
            for (let i = 1; i < n; i++) {
                let x = a + i * h;
                let fx = evaluateFunction(expression, x);
                sum += (i % 2 === 0) ? 2 * fx : 4 * fx;
            }
            
            return (h / 3) * sum;
        }
        
        // Helper function to evaluate mathematical expressions with x variable
        function evaluateFunction(expression, xValue) {
            try {
                // Replace x with the actual value
                let evalExpr = expression
                    .replace(/x/g, `(${xValue})`)
                    .replace(/\^/g, '**')
                    .replace(/π/g, 'Math.PI')
                    .replace(/sin\(/g, isDegreeMode ? 'Math.sin(Math.PI/180*' : 'Math.sin(')
                    .replace(/cos\(/g, isDegreeMode ? 'Math.cos(Math.PI/180*' : 'Math.cos(')
                    .replace(/tan\(/g, isDegreeMode ? 'Math.tan(Math.PI/180*' : 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/exp\(/g, 'Math.exp(');
                
                return eval(evalExpr);
            } catch (error) {
                return NaN;
            }
        }
        
        // Basic symbolic integration for common functions
        function getSymbolicIntegral(expression) {
            expression = expression.trim().toLowerCase();
            
            // Handle simple polynomial terms
            if (expression === 'x') return 'x²/2';
            if (expression === '1' || expression === '') return 'x';
            if (expression === 'x^2' || expression === 'x**2') return 'x³/3';
            if (expression === 'x^3' || expression === 'x**3') return 'x⁴/4';
            
            // Handle trigonometric functions
            if (expression === 'sin(x)') return '-cos(x)';
            if (expression === 'cos(x)') return 'sin(x)';
            if (expression === 'tan(x)') return '-ln|cos(x)|';
            
            // Handle exponential and logarithmic functions
            if (expression === 'exp(x)' || expression === 'e^x') return 'e^x';
            if (expression === '1/x') return 'ln|x|';
            if (expression === 'ln(x)') return 'x*ln(x) - x';
            
            // Handle square root
            if (expression === 'sqrt(x)') return '(2/3)x^(3/2)';
            
            // Handle constants multiplied by x
            let constMatch = expression.match(/^(\d+(?:\.\d+)?)\*?x$/);
            if (constMatch) {
                let constant = parseFloat(constMatch[1]);
                return `${constant}x²/2`;
            }
            
            // Handle x^n where n is a number
            let powerMatch = expression.match(/^x\^(\d+(?:\.\d+)?)$/) || expression.match(/^x\*\*(\d+(?:\.\d+)?)$/);
            if (powerMatch) {
                let power = parseFloat(powerMatch[1]);
                let newPower = power + 1;
                return `x^${newPower}/${newPower}`;
            }
            
            return null; // Cannot integrate symbolically
        }
        
        function shiftMode() {
            isShiftOn = !isShiftOn;
            const shiftBtn = document.querySelector('.shift');
            shiftBtn.classList.toggle('active', isShiftOn);
        }
        
        function alphaMode() {
            isAlphaOn = !isAlphaOn;
            const alphaBtn = document.querySelector('.alpha');
            alphaBtn.classList.toggle('active', isAlphaOn);
        }
        
        function changeMode() {
            isDegreeMode = !isDegreeMode;
            modeDisplay.textContent = isDegreeMode ? 'DEG' : 'RAD';
        }
        
        function powerOn() {
            clearDisplay();
            isShiftOn = false;
            isAlphaOn = false;
            isDegreeMode = true;
            document.querySelector('.shift').classList.remove('active');
            document.querySelector('.alpha').classList.remove('active');
            modeDisplay.textContent = 'DEG';
        }
        
        function memoryAdd() {
            try {
                memory += eval(currentInput);
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        function memoryRecall() {
            inputValue(memory.toString());
        }
        
        function clearMemory() {
            memory = 0;
        }
        
        function fractionInput() {
            inputValue('/');
        }
        
        function fractionToDecimal() {
            try {
                if (currentInput.includes('/')) {
                    let parts = currentInput.split('/');
                    if (parts.length === 2) {
                        let numerator = eval(parts[0]);
                        let denominator = eval(parts[1]);
                        answer = numerator / denominator;
                        display.value = answer.toString();
                        currentInput = answer.toString();
                        cursorPosition = currentInput.length;
                    }
                } else if (currentInput.toLowerCase().includes('e')) {
                    let num = parseFloat(currentInput);
                    answer = num;
                    display.value = answer.toString();
                    currentInput = answer.toString();
                    cursorPosition = currentInput.length;
                } else if (currentInput.includes('.')) {
                    let num = parseFloat(currentInput);
                    let tolerance = 1.0E-6;
                    let h1 = 1, h2 = 0;
                    let k1 = 0, k2 = 1;
                    let b = num;
                    do {
                        let a = Math.floor(b);
                        let aux = h1;
                        h1 = a * h1 + h2;
                        h2 = aux;
                        aux = k1;
                        k1 = a * k1 + k2;
                        k2 = aux;
                        b = 1 / (b - a);
                    } while (Math.abs(num - h1 / k1) > num * tolerance);
                    
                    if (k1 < 1000) {
                        answer = h1 + "/" + k1;
                        display.value = answer;
                        currentInput = answer;
                        cursorPosition = currentInput.length;
                    }
                }
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        function engNotation() {
            try {
                let num = eval(currentInput);
                if (num === 0) {
                    answer = 0;
                } else {
                    let exponent = Math.floor(Math.log10(Math.abs(num)) / 3) * 3;
                    let mantissa = num / Math.pow(10, exponent);
                    answer = mantissa.toFixed(6) + "e" + exponent;
                }
                display.value = answer;
                currentInput = answer.toString();
                cursorPosition = currentInput.length;
            } catch (error) {
                display.value = 'Error';
                currentInput = '';
                cursorPosition = 0;
            }
        }
        
        function scientificNotation() {
            inputValue('e');
        }

        // Initialize the calculator
        modeDisplay.textContent = 'DEG';