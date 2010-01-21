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
        $stmt = $dbh->prepare("SELECT * FROM mobs WHERE mob_id = ?");
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
     * Find tameable mobs for a hunter
     *
     * @param int $player_level     The level of the player
     * @param int $lesser_power     The power level of the Tame Lesser spell
     * @param int $beast_power      The power level of the Tame Beast spell
     * @param int $monster_power    The power level of the Control Monster spell
     *
     * @return Iterator the found Mobs
     */
    public static function findTameable($player_level = 1, $player_realm = 'Syrtis', $regions = '',
                $lesser_power = 5, $beast_power = 5, $monster_power = 5)
    {
        $sql = "CALL GetTameableMobs(?, ?, ?, ?, ?, ?)";
        $stmt = Database::query($sql, $player_level, $player_realm, $regions,
                    $lesser_power, $beast_power, $monster_power);
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__);
    }
}
?>
