<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="GegevensVerkoper2.php" method="post">
Vul een VerkoperID in:<br />
<input type="text" name="VerkoopID" /><br />
Vul uw Voornaam in:<br />
<input type="text" name="Voornaam" /><br />
Vul uw tussenvoegel in:<br />
<input type="text" name="Tussenvoegsel" /><br />
Vul uw achternaam in:<br />
<input type="text" name="Achternaam" /><br />
Vul uw Telefoonnummer in:<br />
<input type="text" name="Telefoonnummer" /><br />
Vul uw EmailVerkoper in:<br />
<input type="text" name="EmailVerkoper" /><br />
<input type="submit" value="Verzend" />
</form>
</body>
</html>
