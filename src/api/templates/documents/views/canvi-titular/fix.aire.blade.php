<?php
$type = 'Canvi de titular';
$contract_type = "Canvi de titular<br> de la telefonia fixa";
$footer_plus = false;
$info_extra = "El tràmit de de canvi de titular es realitzarà un cop s’hagi rebut correctament el present formulari,
signat pel nou titular i l'antic titular del servei."
?>

<div class="all rel">

    <?php
    include TEMPLATES_ROOT . 'views/components/header.blade.php';
    ?>
        <div class="bloc">
            <h2>Dades de l'antic titular</h2>
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
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Telèfon 1</label>
                            <p><?=$user_phone1?></p>
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
                            <label class="box_label">Nom i cognoms del Representant de l'Empresa</label>
                            <p><?= $user_name?></p>
                        </div>
                    </div>
                </div>        
            </div>
        </div>
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
                    <div class="col col-8">
                        <div class="box">
                            <label class="box_label">Telèfon 1</label>
                            <p><?=$user_phone1?></p>
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
                            <label class="box_label">Nom i cognoms del Representant de l'Empresa</label>
                            <p><?= $user_name?></p>
                        </div>
                    </div>
                </div>        
            </div>
        </div>
        <p class="SEPA_text" style="font-size: 11px; line-height: 15px">En cas de baixa de la numeració portada la mateixa tornarà al seu donant inicial.
            <br> Aquest document no és vàlid per a la cessió de numeració en cas de baixa d'abonat amb numeració portada.</p>
        <div class="bloc">
            <h2>Numeració afectada</h2>
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-2 no-border">
                        <div class="box">
                            <label class="box_label">Núm. telèfon des de</label>
                            <p><?=$user_phone1?></p>
                        </div>
                    </div>
                    <div class="col col-2 no-border">
                        <div class="box">
                            <label class="box_label">Fins a</label>
                            <p><?=$user_phone1?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-4-small">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura de l'antic client</label>
                            <?php if(explode(",",$image_signature)[1]){?>
                            <img src="<?=$image_signature?>" width="200">
                            <?php } ?>
                            <p class="down">A 25 de Març de 2020</p>
                        </div>
                    </div>
                    <div class="col col-4-small">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura del nou client</label>
                            <?php if(explode(",",$image_signature)[1]){?>
                            <img src="<?=$image_signature?>" width="200">
                            <?php } ?>
                            <p class="down">A 25 de Març de 2020</p>
                        </div>
                    </div>
                    <div class="col col-4-small">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura del client d'Aire Networks</label>
                            <img src="<?=$gurbtecSignature?>" width="150">
                        </div>
                    </div>
                    <div class="col col-4-small">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura d'Aire networks</label>
                            <img src="<?=$aireSignature?>" alt=""  width="170">
                        </div>
                    </div>
                </div>
            </div>
            <p>Aire Networks del Mediterráneo, SLU CIF: B-53.704.599 C/ Blas Valero, 117 03201 Elche (Alicante) Inscrita en el RM de Alicante, Tomo: 2584, Libro:
                0, Folio: 29, Sección: 8, Hoja: A-72796, Inscripción:</p>
        </div>
</div>
