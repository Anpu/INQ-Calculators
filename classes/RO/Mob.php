<?php
/**
 * Class wrapper around a Mob
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_Mob {
    private $id;
    private $record;

    /**
     * class constructor
     *
     * @param $mob_id
     */
    public function __construct($mob_id)
    {
        $this->record = null;
        $this->id = $mob_id;
    }

    /**
     * Returns this instances Database record ID
     *
     * @return int
     */
    public function ID()
    {
        return $this->id;
    }

    /**
     * Internal method to lazy fetch the data from the database
     */
    private function Fetch()
    {
        if (!is_null($this->record)) return;
        $dbh = Database::get();
        $stmt = $dbh->prepare("SELECT * FROM mob WHERE mob_id = ?");
        $stmt->bindValue(1,$this->ID(), PDO::PARAM_INT);
        $a = $stmt->execute();
        $this->record = $stmt->fetchObject();
        $stmt->closeCursor();
    }

    /*** Object access methods **/
    /**
     * Object access override so we can support lazy loading
     * 
     * @param string $name
     * @return mixed
     */
    public function __get($name) {
        $this->Fetch();
        return $this->record->$name;
    }

    /**
     * Object Access override. Checks for existing instance variables
     *
     * @param string $name
     * @return bool
     */
    public function __isset($name) {
        $this->Fetch();
        return property_exists($this->record, $name);
    }

    /**
     * Find a mob based on a set of criteria
     *
     * @param array $filter An array of property filters
     *
     * @return Iterator the found Mobs
     *
     * @todo Build filtering code and auto joining based on filters
     */
    public static function find(array $filter)
    {
        $sql = "SELECT DISTINCT M.mob_id id FROM mob M";
        $where = array();
        $params = array();
        foreach ($filter as $_k=>$_v) {
            //$where[] = '(A.name = ? AND DA.value = ?)';
            //$params[] = $_k;
            //$params[] = $_v;
        }
        $dbh = Database::get();
        if (!empty($where)) {
            $sql .= " WHERE ".implode(" AND ",$where);
        }
        $stmt = $dbh->prepare($sql);
        $stmt->execute($params);
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__);
    }
}
?>
