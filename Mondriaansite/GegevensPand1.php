<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Voornaam, Tussenvoegsel, Achternaam, VerkoperID FROM verkopers",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="GegevensPand2.php" method="post">
Vul het adres van het Pand in:<br />
<input type="text" name="PandNaam" /><br />

Vul een Verkoper in:<br />
<select name="VerkoperID" >
<?php
while(list($Voornaam, $Tussenvoegsel, $Achternaam, $VerkoperID) = mysql_fetch_row($resultaat))
{
    $Naam = "$Voornaam " . "$Tussenvoegsel " . "$Achternaam";
		print("<option value='$VerkoperID'>$Naam</option>");
}
?>
</select><br />

Vul de VerkoopDatum jjjj-mm-dd in:<br />
<input type="date" name="VerkoopDatum" /><br />

Vul de Inkoopprijs in:<br />
<input type="text" name="Inkoopprijs" /><br />

Vul de Verkoopprijs in:<br />
<input type="text" name="Verkoopprijs" /><br />

Is het Verkocht? Ja/Nee <br />
<input type="text" name="Verkocht?" /><br />

Vul de Regio van het Pand in:<br />
<input type="text" name="RegioPand" /><br />

Vul de Type pand in:<br />
<input type="text" name="Type" /><br />

Vul een link van een Plaatje van het pand in:<br />
<input type="text" name="Plaatje" /><br />

Vul de Postcode van het pand in:<br />
<input type="text" name="Postcode" /><br />

Vul de Plaats van het pand in:<br />
<input type="text" name="Plaats" /><br />

Vul de Oppervlakte van de omliggende grond in:<br />
<input type="text" name="OppervlakteGrond" /><br />

Vul de Oppervlakte van het pand in:<br />
<input type="text" name="OppervlakteHuis" /><br />

Vul het aantal Slaapkamers in:<br />
<input type="text" name="Slaapkamers" /><br />

Vul het Richting van de tuin in:<br />
<input type="text" name="RichtingTuin" /><br />

Vul een beschrijving van het pand in:<br />
<input type="text" name="Beschrijving" /><br />

<input type="submit" value="Verzend" />
</form>
</body>
</html>
