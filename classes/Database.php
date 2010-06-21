<?php
/**
 * Description of Database
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class Database {
    /**
     * @var string Database Connection String
     */
    static private $dsn;
    /**
     * @var string Database Login User
     */
    static private $user;
    /**
     * @var string Database Login Password
     */
    static private $pass;
    /**
     * @var PDO Database Handle
     */
    static private $dbh;

    function __construct()
    {
        throw new RuntimeException("This class can not be instantiated");
    }

    public static function setDSN($dsn, $user, $pass)
    {
        self::$dsn = $dsn;
        self::$user = $user;
        self::$pass = $pass;
    }

    /**
     * Fetch the database connection
     *
     * @return PDO The Databse connection object
     */
    public static function get()
    {
        if (empty(self::$dbh)) {
            if (!extension_loaded('PDO')) {
                throw new Exception("Missing PDO Extension");
            }
            self::$dbh = new PDO(self::$dsn, self::$user, self::$pass);
            self::$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $driver = self::$dbh->getAttribute(PDO::ATTR_DRIVER_NAME);
            if ($driver == 'mysql') {
                // Set UTF-8 Locale
                self::$dbh->exec("SET NAMES 'utf8'");
            }
        }
        return self::$dbh;
    }

    /**
     * Quick Prepare and execute a query
     *
     * @param string $sql   The query to execute
     * @param mixed ...     The paramters to place in the query
     */
    public static function query($sql/* ...*/)
    {
        $stmt = self::get()->prepare($sql);
        $args = func_get_args();
        // Throw away the first argument (our query)
        array_shift($args);
        $stmt->execute($args);
        return $stmt;
    }
}
?>
