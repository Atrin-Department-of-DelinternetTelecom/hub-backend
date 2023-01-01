<?php
$type = 'Baixa';
$contract_type = "Sol·licitud de desvinculació<br> del la telefonia fixa";
$footer_plus = false;
$info_extra = "Reconozco expresamente que la baja solicitada no me exime del pago de las cantidades pendientes de pago que, en su caso, según
el contrato de servicio suscrito, hayan sido devengadas y no pagadas hasta la fecha."
?>

<div class="all rel">

    <?php
    include TEMPLATES_ROOT . 'views/components/header.blade.php';
    ?>
        <div class="bloc">
            <h2>Dades del titular</h2>
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
       
        <p class="SEPA_text" style="font-size: 11px; line-height: 15px">Comunica a Aire Networks del Mediterráneo S.L.U, amb CIF B-53704599, i domicili a efecte de notificació: c/Blas Valero, 117 Ent.,
            Elche C.P. 03201 (Alacant), el seu desig exprés i inequívoc que sigui tramitada la baixa de numeració portada.</p>
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
        <div class="bloc">
            <h2>Motiu de baixa</h2>
            <div class="sub_bloc">
                <div>
                    <div>
                        <div class="box_gran" style="max-height: 100px">
                            <label class="box_label">Necessitem que ens indiquis el motiu de baixa</label>
                            <p></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p class="SEPA_text" style="font-size: 11px; line-height: 15px">
            Reconec expressament que la baixa sol·licitada no em eximeix de l'pagament de les quantitats pendents de pagament que, si escau, segons el contracte de servei subscrit, hagin estat meritades i no pagades fins a la data.</p>
        <div class="footer">
            <div class="sub_bloc">
                <div class="row clearfix">
                    <div class="col col-2">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura de l'abonat d'Aire Networks</label>
                            <img src="<?=$gurbtecSignature?>" width="200">
                        </div>
                    </div>
                    <div class="col col-2">
                        <div class="box_gran full_height">
                            <label class="box_label">Signatura de l'usuari</label>
                            <?php if(explode(",",$image_signature)[1]){?>
                            <img src="<?=$image_signature?>" width="200">
                            <?php } ?>
                            <p class="down">A 25 de Març de 2020</p>
                        </div>
                    </div>
                </div>
            </div>
            <p>Aire Networks del Mediterráneo, SLU CIF: B-53.704.599 C/ Blas Valero, 117 03201 Elche (Alicante) Inscrita en el RM de Alicante, Tomo:
                2584, Libro: 0, Folio: 29, Sección: 8, Hoja: A-72796, Inscripción:</p>
        </div>
</div>
