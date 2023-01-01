<?php
$type = 'Desistiment';
$contract_type = "Exercici del dret<br> de desistiment";
$footer_plus = false;
$info_extra = '';
?>

<div class="all rel">

    <?php
    include 'views/components/header.blade.php';
    ?>
        <div class="bloc">
            <h2>Exercici del meu dret de desistiment</h2>
            <div>
                <div>
                    <div>
                        <div class="paragraph">
                            <p class="p_desistiment">Benvolguts Srs,
                                <br><br>
                                Em dirigeixo a vostès, en el present escrit, en relació a l’assumpte al marge referenciat, sent vostè el venedor
                                o empresari, i qui subscriu, el consumidor o usuari. <br> <br>
                                Que el dia <?=$date_day?>, a les <?=$date_hour?> hores, vaig adquirir/contractar, presencialment, telemàticament
                                o telefònicament, el servei <?=$service?> de per un import de <?=$preu_desistiment?> euros, en total. <br> <br>
                                No obstant, un cop contractat els serveis o rebuts els productes, he decidit retornar-los, dintre del termini establert
                                per exercir el dret de desistiment, d’acord amb la Legislació de Defensa del Consumidor i Usuari.
                                <br> <br>
                                Que el producte o servei no ha estat utilitzat ni activat i es troba en el mateix estat original d’enviament.
                                <br> <br>
                                Per l’exercici dels meus drets, el dia <?=$date_day?> m’he posat en contacte amb el servei d’atenció
                                a l’usuari de DELINTERNET.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php
    include 'views/components/footer.blade.php';
    ?>
</div>
