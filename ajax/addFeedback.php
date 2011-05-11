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
 * Submits the feedback to an external ticketing system
 *
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ajax_addFeedback extends AjaxRequest {
	public $cache = false;

    public function request($path_args) {
        global $config;

        $json = file_get_contents("php://input");
        $data = json_decode($json);

        $issue = self::prepIssue($data);
        $soap = new SoapClient($config->mantis->wsdl);
        try {
            $issue_id = $soap->mc_issue_add(
                    $config->mantis->user,
                    $config->mantis->pass,
                    $issue);
            return array(
                'success'=>true,
                'version'=>$soap->mc_version(),
                'issue_id'=>$issue_id,
            );
        } catch (SoapFault $ex) {
            throw new Exception("Failed to log feedback");
        }
    }

    private static function prepIssue($data) {
        global $config;
        $base = array(
            'summary'=>self::getSummary($data),
            'description'=>self::getDescription($data),
            'additional_information'=>json_encode($data),
            'project'=>array('id'=>$config->mantis->project_id),
            'category'=>self::getCategory($data),
        );
        if (!empty($config->mantis->tool_version)) {
            $base['version'] = $config->mantis->tool_version;
        }
        return $base;
    }

    private static function getSummary($data) {
        switch ($data->request) {
            case 'feedback':
                return $data->feedback->type;
            case 'update':
                $pre = "Update ";
            case 'new':
                if (empty($pre)) $pre = "Missing ";
                switch ($data->item) {
                    case 'mob':
                        return $pre.$data->mob->name;
                    case 'npc':
                        return $pre.$data->npc->name;
                    case 'area':
                        return $pre.$data->area->name;
                }
                break;
        }
        return "Unknown";
    }

    private static function getDescription($data) {
        $name =
            'Name: '.(empty($data->name) ? "Unknown" : $data->name)
                .' of '.(empty($data->server) ? "Unknown" : $data->server)."\n"
            .'Email: '.(empty($data->email) ? "Unknown" : $data->email)."\n\n";

        switch ($data->request) {
            case 'feedback':
                return $name.'Notes: '.$data->feedback->notes;
            case 'update':
            case 'new':
                switch ($data->item) {
                    case 'mob':
                        return $name.implode("\n",array(
                            'Name: '.$data->mob->name,
                            'Level: '.$data->mob->level,
                            'Type: '.$data->mob->type,
                            'Tameable: '.$data->mob->tameable,
                            'Areas: '.$data->mob->areas,
                            'Notes: '.$data->mob->notes,
                        ));
                    case 'npc':
                        return $name.implode("\n",array(
                            'Name: '.$data->npc->name,
                            'Area: '.$data->npc->area,
                            'Location: '.$data->npc->location,
                            'Profession: '.$data->npc->profession,
                            'Notes: '.$data->mob->notes,
                        ));
                    case 'area':
                        return $name.implode("\n",array(
                            'Name: '.$data->area->name,
                            'Realm: '.$data->area->realm,
                            'Bounds: '.$data->area->bounds,
                            'Notes: '.$data->area->notes,
                        ));
                }
                break;
        }
        return $name."Unknown Feedback Request";
    }

    private static function getCategory($data) {
        switch ($data->request) {
            case 'feedback':
                return $data->feedback->type;
            case 'update':
                $pre = "Update ";
            case 'new':
                if (empty($pre)) $pre = "Missing ";
                switch ($data->item) {
                    case 'mob':
                        return $pre.'Mob';
                    case 'npc':
                        return $pre.'NPC';
                    case 'area':
                        return $pre.'Area';
                }
                break;
        }
        return "Unknown";
    }
}
?>
