<?php
/**
 * Template class to setup PHP TAL
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class Template extends PHPTAL {
    static private $_template_dirs = array();

    public function __construct($template) {
        $this->setTemplateRepository(self::$_template_dirs);
        if (DEBUG) {
            $this->setForceReparse(true);
        }
        parent::__construct($template);
    }

    public static function addTemplatePath($templatedir) {
        self::$_template_dirs[] = $templatedir;
    }
}
?>
