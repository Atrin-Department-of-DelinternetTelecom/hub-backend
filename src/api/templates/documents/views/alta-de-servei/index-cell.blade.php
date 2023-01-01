
<?php
        $contract_type = "Prestació de servei <br>de telefonia mòbil";
        $type = 'Contracte';
        $footer_plus = true;
        $info_extra = '';
?>


<div class="all rel">

    <?php
    include TEMPLATES_ROOT . 'views/components/header.blade.php';
    include TEMPLATES_ROOT . 'views/components/personal_info.blade.php'
    ?>
    <div class="bloc">
        <h2>Servei Contractat</h2>
        <div class="sub_bloc">
            <div>
                <div>
                    <div class="box">
                        <label class="box_label">Tarifa</label>
                        <p><?=$fee_name?></p>
                    </div>
                </div>
            </div>
            <div class="row clearfix">
                <div class="col col-4">
                    <div class="box">
                        <div class="box_2">
                            <label class="box_label">Portabilitat</label>
                            <p>del número de telèfon</p>
                            <span class="checkmark"></span>
                            <?php
                            if($cell_portability){
                            ?>
                            <span class="checkmark" style="border-color: #65c53d !important;"></span>
                            <span class="checkcheck"></span>
                            <?php
                            }
                            ?>
                        </div>
                    </div>
                </div>
                <div class="col col-4">
                    <div class="box">
                        <div class="box_2">
                            <label class="box_label">Numeració nova</label>
                            <p>del número de telèfon</p>
                            <span class="checkmark"></span>
                            <?php
                            if(!$cell_portability){
                            ?>
                            <span class="checkmark" style="border-color: #65c53d !important;"></span>
                            <span class="checkcheck"></span>
                            <?php
                            }
                            ?>
                        </div>

                    </div>
                </div>
                <div class="col col-4">
                    <div class="box">
                        <label class="box_label">Número de mòbil</label>
                        <p><?=$cell_number?></p>
                    </div>

                </div>
            </div>
            <div>
                <div>
                    <div class="box_gran">
                        <label class="box_label">Característiques</label>
                        <p><?=($fee_description)?></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
    include 'views/components/footer.blade.php';
    ?>
</div>
<div class="all rel">
    <?php
    include 'views/components/condicions_aire.blade.php'
    ?>
</div>
