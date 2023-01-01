<?php
$type = 'Baixa';
$contract_type = "Sol·licitud de desvinculació<br> del servei";
$footer_plus = false;
$info_extra = "El tràmit de desvinculació de Delinternet es realitzarà un cop s’hagi rebut correctament el present formulari,
signat pel titular del servei."
?>

<div class="all rel">

    <?php
    include TEMPLATES_ROOT . 'views/components/header.blade.php';
    ?>
        <div class="bloc">
            <h2>Dades personals de l'usuari</h2>
            <div class="sub_bloc">
                <div>
                    <div>
                        <div class="box">
                            <label class="box_label">Nom del titular / Raó social: </label>
                            <p><?=$user_name?></p>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <div class="box">
                            <label class="box_label">DNI/NIE/NIF: </label>
                            <p><?=$user_DNI?></p>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <div class="box">
                            <label class="box_label">Persona de contacte:  </label>
                            <p><?=$user_name?></p>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="no-border">
                        <div class="box">
                            <label class="box_label">Telèfon de contacte: </label>
                            <p><?=$user_phone1?></p>
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
            <h2>Motiu de baixa</h2>
            <div class="sub_bloc">
                <div>
                    <div>
                        <div class="box_gran" style="max-height: 100px">
                            <label class="box_label">Necessitem que ens indiquis el motiu de baixa</label>
                            <p><?=$document_reason?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php
    include TEMPLATES_ROOT . 'views/components/footer.blade.php';
    ?>
</div>
