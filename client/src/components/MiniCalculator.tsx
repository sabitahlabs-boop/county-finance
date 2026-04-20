import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MiniCalculator() {
  const [isOpen, setIsOpen] = useState(false); // Start CLOSED — manual trigger only
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const performOperation = useCallback((nextOp: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      let result = 0;
      switch (operator) {
        case "+": result = prevValue + current; break;
        case "-": result = prevValue - current; break;
        case "×": result = prevValue * current; break;
        case "÷": result = current !== 0 ? prevValue / current : 0; break;
        default: result = current;
      }
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperator(nextOp === "=" ? null : nextOp);
    setWaitingForOperand(true);
  }, [display, prevValue, operator, waitingForOperand]);

  const toggleSign = useCallback(() => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  }, [display]);

  const percentage = useCallback(() => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  }, [display]);

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0";
    if (val.endsWith(".")) return val;
    if (val.includes(".")) return val;
    return num.toLocaleString("id-ID");
  };

  const btnClass = "h-12 text-lg font-medium rounded-xl transition-all active:scale-95";
  const numClass = `${btnClass} bg-muted hover:bg-muted/80`;
  const opClass = `${btnClass} bg-[#1E4D9B] text-white hover:bg-[#1a4389]`;
  const funcClass = `${btnClass} bg-muted/50 hover:bg-muted/80 text-muted-foreground`;

  return (
    <>
      {/* FAB trigger button — always visible when calculator is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] hover:shadow-xl hover:from-[#1a4389] hover:to-[#1d4ed8] transition-all"
              title="Buka Kalkulator"
            >
              <Calculator className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculator panel — only shown when user clicks the FAB */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 w-72"
            drag
            dragMomentum={false}
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardHeader className="p-3 bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span className="text-sm font-medium">Kalkulator</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white dark:bg-gray-900/20" onClick={() => setIsOpen(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {/* Display */}
                <div className="bg-muted/50 rounded-xl p-3 text-right">
                  {operator && prevValue !== null && (
                    <div className="text-xs text-muted-foreground">{prevValue.toLocaleString("id-ID")} {operator}</div>
                  )}
                  <div className="text-2xl font-bold truncate">{formatDisplay(display)}</div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <Button className={funcClass} onClick={clear}>C</Button>
                  <Button className={funcClass} onClick={toggleSign}>±</Button>
                  <Button className={funcClass} onClick={percentage}>%</Button>
                  <Button className={opClass} onClick={() => performOperation("÷")}>÷</Button>

                  <Button className={numClass} onClick={() => inputDigit("7")}>7</Button>
                  <Button className={numClass} onClick={() => inputDigit("8")}>8</Button>
                  <Button className={numClass} onClick={() => inputDigit("9")}>9</Button>
                  <Button className={opClass} onClick={() => performOperation("×")}>×</Button>

                  <Button className={numClass} onClick={() => inputDigit("4")}>4</Button>
                  <Button className={numClass} onClick={() => inputDigit("5")}>5</Button>
                  <Button className={numClass} onClick={() => inputDigit("6")}>6</Button>
                  <Button className={opClass} onClick={() => performOperation("-")}>−</Button>

                  <Button className={numClass} onClick={() => inputDigit("1")}>1</Button>
                  <Button className={numClass} onClick={() => inputDigit("2")}>2</Button>
                  <Button className={numClass} onClick={() => inputDigit("3")}>3</Button>
                  <Button className={opClass} onClick={() => performOperation("+")}>+</Button>

                  <Button className={`${numClass} col-span-2`} onClick={() => inputDigit("0")}>0</Button>
                  <Button className={numClass} onClick={inputDot}>.</Button>
                  <Button className={`${btnClass} bg-[#F47920] text-white hover:bg-[#e06d18]`} onClick={() => performOperation("=")}>=</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
