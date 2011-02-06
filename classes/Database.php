<?php
/*
 * This file is part of INQ Calculators.
 *
 * INQ Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */

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
