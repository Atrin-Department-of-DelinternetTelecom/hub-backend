<?php
$type = 'Canvi de titular';
$contract_type = "Canvi de titular<br> del servei";
$footer_plus = false;
$info_extra = "El tràmit de de canvi de titular es realitzarà un cop s’hagi rebut correctament el present formulari,
signat pel nou titular i l'antic titular del servei."
?>

<div class="all rel">

    <?php
    include TEMPLATES_ROOT . 'views/components/header.blade.php';
    ?>
        <div class="bloc">
            <h2>Dades del nou titular</h2>
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Nom del titular / Raó social</label>
                            <p><?=$user_name?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">DNI/NIE/NIF</label>
                            <p><?=$user_DNI?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Adreça de facturació</label>
                            <p><?=$user_address?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">Codi Postal</label>
                            <p><?=$user_CP?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Localitat</label>
                            <p><?=$user_city?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">Provincia</label>
                            <p><?=$user_region?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">Telèfon 1</label>
                            <p><?=$user_phone1?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">Telèfon 2</label>
                            <p><?=$user_phone2?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">E-mail</label>
                            <p><?= $user_email?></p>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="no-border">
                        <div class="box">
                            <label class="box_label">Nº compte corrent</label>
                            <p><?= $user_current_account?></p>
                        </div>
                    </div>
                </div>        
            </div>
        </div>
        <div class="bloc">
            <h2>Tipus de baixa</h2>
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box">
                            <div class="box_2">
                                <label class="box_label">Internet Fibra Òptica</label>
                                <p>Sol·licitud de baixa</p>
                                <span class="checkmark"></span>
                                <?php
                                if($cancel_net){
                                ?>
                                <span class="checkmark" style="border-color: #65c53d !important;"></span>
                                <span class="checkcheck"></span>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box">
                            <label class="box_label">Adreça d'instal·lació de la fibra</label>
                            <p><?=($cancel_net ? $installation_address : "")?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box">
                            <div class="box_2">
                                <label class="box_label">Internet Radioenllaç</label>
                                <p>Sol·licitud de baixa</p>
                                <span class="checkmark"></span>
                                <?php
                                if($cancel_radio){
                                ?>
                                <span class="checkmark" style="border-color: #65c53d !important;"></span>
                                <span class="checkcheck"></span>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box">
                            <label class="box_label">Adreça d'instal·lació del radioenllaç</label>
                            <p><?=($cancel_radio ? $installation_address : "")?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box">
                            <div class="box_2">
                                <label class="box_label">Telèfon Mòbil</label>
                                <p>Sol·licitud de baixa</p>
                                <span class="checkmark"></span>
                                <?php
                                if($cancel_cell){
                                ?>
                                <span class="checkmark" style="border-color: #65c53d !important;"></span>
                                <span class="checkcheck"></span>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box">
                            <label class="box_label">Número de telèfon mòbil</label>
                            <p><?=($cancel_cell ? $cell_number : "")?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box">
                            <div class="box_2">
                                <label class="box_label">Telèfon Fixa</label>
                                <p>Sol·licitud de baixa</p>
                                <span class="checkmark"></span>
                                <?php
                                if($cancel_fix){
                                ?>
                                <span class="checkmark" style="border-color: #65c53d !important;"></span>
                                <span class="checkcheck"></span>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box">
                            <label class="box_label">Número de telèfon fix</label>
                            <p><?=($cancel_fix ? $fix_number : "")?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-2 no-border">
                        <div class="box">
                            <div class="box_2">
                                <label class="box_label">Televisió</label>
                                <p>Sol·licitud de baixa</p>
                                <span class="checkmark"></span>
                                <?php
                                if($cancel_tv){
                                ?>
                                <span class="checkmark" style="border-color: #65c53d !important;"></span>
                                <span class="checkcheck"></span>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="col col-2 no-border">
                        <div class="box">
                            <label class="box_label">Equips </label>
                            <p></p>
                        </div>
                    </div>
                </div>
            </div>
            <p>*Pots obtenir les dades dels serveis contractats al contracte d’usuari o bé a la teva àrea my.delinternet.com.</p>
        </div>
        <div class="bloc">
            <h2>Antic Titular</h2>
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Nom del'antic titular / Raó social</label>
                            <p><?=$user_name?></p>
                        </div>
                    </div>
                    <div class="col col-4">
                        <div class="box">
                            <label class="box_label">DNI/NIE/NIF</label>
                            <p><?=$user_DNI?></p>
                        </div>
                    </div>
                </div>
                <div class="row clearfix">
                    <div class="col col-8 no-border">
                        <div class="box">
                            <label class="box_label">Telèfon</label>
                            <p><?=$user_phone1?></p>
                        </div>
                    </div>
                    <div class="col col-4 no-border">
                        <div class="box">
                            <label class="box_label">E-mail</label>
                            <p><?=$user_email?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura del nou titular</label>
                            <?php if(explode(",",$image_signature)[1]){?>
                            <img src="<?=$image_signature?>" width="200">
                            <?php } ?>
                            <p class="down">A 25 de Març de 2020</p>
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura de l'antic titular</label>
                            <?php if(explode(",",$image_signature)[1]){?>
                            <img src="<?=$image_signature?>" width="200">
                            <?php } ?>
                            <p class="down">A 25 de Març de 2020</p>
                        </div>
                    </div>
                </div>
            </div>
            <p>DEL-INTERNET TELECOM S.L.U · REGISTRE MERCANTIL VOLUM 43932. FOLI 75. FULLA 442032. INSCRIPCIÓ 1. DATA 05 DE SETEMBRE DE 2013 · NIF ESB55606446 · Plaça Mercat La Cava 1 Local Delinternet · 43580 Deltebre · TARRAGONA · 877990500 · info@delinternet.com</p>
        </div>
</div>