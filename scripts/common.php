<?php
class ActionScale extends Console_CommandLine_Action {
    public function execute($value = false, $params = array()) {
        $p = explode(':', trim($value));
        if (count($p) != 2) {
            throw new Exception(sprintf(
                'Option "%s" must be 2 integeres separated by a colon (:)',
                $this->option->name
            ));
        }
        list ($num, $den) = self::simplify($p[0], $p[1]);
        $this->setResult((object)array('num'=>$num,'den'=>$den));
    }
    private static function simplify($num, $den) {
        $a = $num;
        $b = $den;
        for ($r = $a % $b;
            $r != 0;
            $a = $b, $b = $r, $r = $a % $b);

        return array($num / $b, $den / $b);
    }
}

Console_CommandLine::registerAction("Scale", "ActionScale");

?>
